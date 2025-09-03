import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import * as express from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { DifyService } from '../../shared/services/dify.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { extractUserIdFromRequest } from '../../shared/utils/user.utils';
import { StreamingCitationParser } from '../../shared/utils/citation-parser.util';
import { ErrorHandlerUtil } from '../../shared/utils/error-handler.util';
import { ChatRequestSchema, ChatRole } from '../../types';
import type {
  ChatRequest,
  Conversation,
  AuthenticatedRequest,
  Citation,
} from '../../types';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChatController {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly difyService: DifyService,
  ) {
    this.logger.setContext('ChatController');
  }

  // POST /api/chat - 流式聊天API
  @Post('chat')
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
    @Request() req: AuthenticatedRequest & express.Request,
    @Res() res: express.Response,
  ): Promise<void> {
    this.logger.log('开始处理聊天请求', {
      requestMethod: req.method,
      requestUrl: req.url,
      hasKnowledgeBase: !!body.knowledgeBaseId,
      messageLength: body.message.length,
    });

    const userId = extractUserIdFromRequest(req);

    this.logger.debug('用户信息处理完成', {
      username: req.user.username,
      userId,
      conversationId: body.conversationId || 'new',
    });

    try {
      // 1. 获取或创建会话
      let conversationId = body.conversationId;
      let conversation: Conversation;

      if (!conversationId) {
        // 创建新会话
        this.logger.log('创建新会话', {
          userId,
          messagePreview: body.message.substring(0, 50),
        });
        const title = this.generateConversationTitle(body.message);
        conversation = await this.conversations.createConversation(
          userId,
          title,
          body.knowledgeBaseId,
        );
        conversationId = conversation.id;
        this.logger.log('新会话创建成功', { conversationId, title });
      } else {
        // 验证会话是否属于该用户
        this.logger.debug('验证会话所有权', { conversationId, userId });
        const owned = await this.messages.isConversationOwnedByUser(
          conversationId,
          userId,
        );
        if (!owned) {
          this.logger.warn('会话所有权验证失败', { conversationId, userId });
          throw new BadRequestException('Conversation not found');
        }
        this.logger.debug('会话所有权验证通过', { conversationId, userId });

        // 读取会话详情，用于回填知识库/模型等信息
        const convo = await this.conversations.getById(conversationId);
        if (convo) {
          // 若请求体未传知识库，则回填为会话存储值
          if (!body.knowledgeBaseId && convo.knowledgeBaseId) {
            body.knowledgeBaseId = convo.knowledgeBaseId;
          }
          // 若请求体未传模型，则回填为会话存储值
          if (!body.modelId && convo.modelId) {
            body.modelId = convo.modelId;
          }
        }
      }

      // 设置流式响应headers（包含会话ID）
      this.logger.debug('设置SSE响应头', { conversationId });
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Conversation-ID',
        'X-Conversation-ID': conversationId,
      });

      // 2. 保存用户消息
      this.logger.debug('保存用户消息到数据库', {
        conversationId,
        messageLength: body.message.length,
      });
      const userMessage = await this.messages.append(
        conversationId,
        ChatRole.User,
        body.message,
        userId,
      );
      this.logger.log('用户消息保存成功', {
        messageId: userMessage.id,
        conversationId,
      });

      // 3. 生成AI助手响应（流式）
      this.logger.log('开始生成AI响应', {
        conversationId,
        hasKnowledgeBase: !!body.knowledgeBaseId,
      });
      const result = await this.generateStreamingResponse(
        res,
        conversationId,
        body.message,
        body.knowledgeBaseId,
        body.modelId,
        req.user?.username,
      );
      this.logger.log('聊天请求处理完成', {
        conversationId,
        assistantMessageId: result.messageId,
        responseLength: result.content.length,
      });
    } catch (error) {
      // 使用统一的错误处理工具
      ErrorHandlerUtil.handleStreamingError(error, res, {
        conversationId: body.conversationId,
        userId,
        operation: 'chat',
      });
    } finally {
      this.logger.debug('关闭SSE连接');
      res.end();
    }
  }

  private async generateStreamingResponse(
    res: express.Response,
    conversationId: string,
    userMessage: string,
    knowledgeBaseId?: string,
    modelId?: string,
    username?: string,
  ): Promise<{ messageId: string; content: string }> {
    this.logger.debug('开始生成流式响应', {
      conversationId,
      messageLength: userMessage.length,
      hasKnowledgeBase: !!knowledgeBaseId,
    });

    try {
      this.logger.debug('调用Dify API', { conversationId });

      // 获取已存在的Dify对话ID，用于维持连续对话记忆
      const existingDifyConversationId =
        await this.conversations.getDifyConversationId(conversationId);
      this.logger.debug('获取已存在的Dify对话ID', {
        conversationId,
        existingDifyConversationId,
      });

      // 调用Dify API获取流式响应，传递已存在的对话ID以维持记忆
      const stream = await this.difyService.chatWithStreaming(
        userMessage,
        conversationId, // 使用conversationId作为user参数
        knowledgeBaseId,
        existingDifyConversationId || undefined, // 传递Dify对话ID维持记忆（null转换为undefined）
        modelId,
        username,
      );

      if (!stream) {
        throw new Error('Failed to get stream from Dify API');
      }

      let assistantMessage = '';
      let buffer = '';
      let difyConversationIdFromResponse: string | null = null;
      // 初始化citation解析器
      const citationParser = new StreamingCitationParser();
      const allExtractedCitations: Citation[] = [];

      // 使用Node.js流处理
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');

          // 保留最后一个不完整的行
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            const streamData = this.difyService.parseDifyStreamLine(line);
            if (!streamData) continue;

            // 捕获Dify返回的conversation_id，用于后续保存
            if (streamData.conversation_id && !difyConversationIdFromResponse) {
              difyConversationIdFromResponse = streamData.conversation_id;
              this.logger.debug('捕获到Dify对话ID', {
                conversationId,
                difyConversationId: difyConversationIdFromResponse,
              });
            }

            // 处理消息内容
            if (
              streamData.event === 'message' ||
              streamData.event === 'agent_message'
            ) {
              if (streamData.answer) {
                // 使用citation解析器处理流式内容
                const parseResult = citationParser.processChunk(
                  streamData.answer,
                );

                // 累加清理后的内容到助手消息
                assistantMessage += parseResult.cleanContent;

                // 收集提取的citations
                if (parseResult.extractedCitations.length > 0) {
                  allExtractedCitations.push(...parseResult.extractedCitations);
                  this.logger.debug('从流式响应中提取到citations', {
                    conversationId,
                    citationCount: parseResult.extractedCitations.length,
                  });
                }

                // 发送清理后的内容到前端（移除了citation标签）
                if (parseResult.cleanContent) {
                  res.write(
                    `data: ${JSON.stringify({
                      event: streamData.event,
                      answer: parseResult.cleanContent,
                      metadata: streamData.metadata,
                    })}\n\n`,
                  );
                }
              }
            }

            // 处理消息结束事件
            if (streamData.event === 'message_end') {
              this.logger.debug('收到消息结束事件', { conversationId });

              // 合并来自citation标签和retriever_resources的引用信息
              const existingResources =
                streamData.metadata?.retriever_resources || [];
              const allCitations = [
                ...existingResources,
                ...allExtractedCitations,
              ];

              // 去重处理（基于content或segment_id）
              const uniqueCitations = allCitations.filter(
                (citation, index, arr) => {
                  return (
                    arr.findIndex(
                      (c) =>
                        c.content === citation.content ||
                        (c.segment_id && c.segment_id === citation.segment_id),
                    ) === index
                  );
                },
              );

              this.logger.log('合并引用信息完成', {
                conversationId,
                originalResourcesCount: existingResources.length,
                extractedCitationsCount: allExtractedCitations.length,
                finalCitationsCount: uniqueCitations.length,
              });

              // 发送合并后的引用信息到前端
              if (uniqueCitations.length > 0) {
                res.write(
                  `data: ${JSON.stringify({
                    event: 'message_end',
                    metadata: {
                      ...streamData.metadata,
                      retriever_resources: uniqueCitations,
                    },
                  })}\n\n`,
                );
              } else if (streamData.metadata) {
                // 如果没有引用但有其他metadata，仍然发送
                res.write(
                  `data: ${JSON.stringify({
                    event: 'message_end',
                    metadata: streamData.metadata,
                  })}\n\n`,
                );
              }

              resolve();
              return;
            }

            // 处理错误事件
            if (streamData.event === 'error') {
              reject(new Error('Dify API returned error'));
              return;
            }
          }
        });

        stream.on('end', () => {
          this.logger.debug('Dify流结束', { conversationId });
          resolve();
        });

        stream.on('error', (error: Error) => {
          this.logger.error('Dify流错误', error.stack, { conversationId });
          reject(error);
        });
      });

      this.logger.log('Dify流式响应完成', {
        conversationId,
        contentLength: assistantMessage.length,
      });

      // 发送结束标记
      res.write(`data: [DONE]\n\n`);

      // 保存完整的助手消息到数据库
      const savedMessage = await this.messages.append(
        conversationId,
        ChatRole.Assistant,
        assistantMessage,
      );

      // 如果捕获到新的Dify对话ID，且与数据库中的不同，则更新数据库
      if (
        difyConversationIdFromResponse &&
        difyConversationIdFromResponse !== existingDifyConversationId
      ) {
        await this.conversations.updateDifyConversationId(
          conversationId,
          difyConversationIdFromResponse,
        );
        this.logger.log('更新Dify对话ID到数据库', {
          conversationId,
          oldDifyConversationId: existingDifyConversationId,
          newDifyConversationId: difyConversationIdFromResponse,
        });
      }

      return {
        messageId: savedMessage.id,
        content: assistantMessage,
      };
    } catch (error) {
      this.logger.error(
        'generateStreamingResponse方法出错',
        error instanceof Error ? error.stack : undefined,
        {
          conversationId,
          errorMessage: error instanceof Error ? error.message : '未知错误',
        },
      );

      // 发送错误事件到前端，而不是作为普通消息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      res.write(
        `data: ${JSON.stringify({
          event: 'error',
          error: `处理请求时发生错误：${errorMessage}。请稍后再试。`,
        })}\n\n`,
      );

      // 不将错误消息保存到数据库，直接抛出异常让上层处理
      throw error;
    }
  }

  private generateConversationTitle(firstMessage: string): string {
    // 简单的标题生成逻辑，取前20个字符
    const title =
      firstMessage.length > 20
        ? firstMessage.substring(0, 20) + '...'
        : firstMessage;
    return title;
  }
}
