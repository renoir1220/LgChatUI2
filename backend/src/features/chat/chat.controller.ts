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
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { ChatRequestSchema, ChatRole } from '@lg/shared';
import type { ChatRequest, Conversation } from '@lg/shared';

interface AuthenticatedRequest {
  user: {
    username: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChatController {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly difyService: DifyService,
  ) {}

  // POST /api/chat - 流式聊天API
  @Post('chat')
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
    @Request() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ): Promise<void> {
    console.log('=== 开始处理聊天请求 ===');
    console.log('请求体:', JSON.stringify(body, null, 2));
    console.log('用户信息:', req.user);

    const username = req.user.username;
    const userId = `user_${username}`;

    console.log('提取的userId:', userId);

    try {
      // 1. 获取或创建会话
      let conversationId = body.conversationId;
      let conversation: Conversation;

      console.log('处理会话ID:', conversationId);
      if (!conversationId) {
        // 创建新会话
        console.log('创建新会话...');
        const title = this.generateConversationTitle(body.message);
        conversation = await this.conversations.createConversation(
          userId,
          title,
          body.knowledgeBaseId,
        );
        conversationId = conversation.id;
        console.log('新会话创建成功:', conversationId);
      } else {
        // 验证会话是否属于该用户
        console.log('验证会话所有权...');
        const owned = await this.messages.isConversationOwnedByUser(
          conversationId,
          userId,
        );
        console.log('会话所有权验证结果:', owned);
        if (!owned) {
          throw new BadRequestException('Conversation not found');
        }
      }

      // 设置流式响应headers（包含会话ID）
      console.log('设置SSE响应头...');
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Conversation-ID',
        'X-Conversation-ID': conversationId,
      });

      // 2. 保存用户消息
      console.log('保存用户消息到数据库...');
      const userMessage = await this.messages.append(
        conversationId,
        ChatRole.User,
        body.message,
        userId,
      );
      console.log('用户消息保存成功:', userMessage.id);

      // 3. 生成AI助手响应（流式）
      console.log('开始生成AI响应...');
      const result = await this.generateStreamingResponse(
        res,
        conversationId,
        body.message,
        body.knowledgeBaseId,
      );
      console.log('AI响应生成完成, 结果:', result);
      console.log('=== 聊天请求处理完成 ===');
    } catch (error) {
      console.error('=== 聊天请求处理出错 ===');
      console.error('错误详情:', error);
      // 发送错误事件
      res.write(
        `data: ${JSON.stringify({
          event: 'error',
          error: error instanceof Error ? error.message : '处理请求时发生错误',
        })}\n\n`,
      );
    } finally {
      console.log('关闭SSE连接');
      res.end();
    }
  }

  private async generateStreamingResponse(
    res: express.Response,
    conversationId: string,
    userMessage: string,
    knowledgeBaseId?: string,
  ): Promise<{ messageId: string; content: string }> {
    console.log('--- generateStreamingResponse 开始 ---');
    console.log(
      '参数: conversationId:',
      conversationId,
      'userMessage:',
      userMessage,
      'knowledgeBaseId:',
      knowledgeBaseId,
    );

    try {
      console.log('调用Dify API...');

      // 调用Dify API获取流式响应
      // 不传递conversationId给Dify，让Dify自己管理会话
      const stream = await this.difyService.chatWithStreaming(
        userMessage,
        conversationId, // 使用conversationId作为user参数
        knowledgeBaseId,
        undefined, // 不传递conversationId给Dify
      );

      if (!stream) {
        throw new Error('Failed to get stream from Dify API');
      }

      let assistantMessage = '';
      let buffer = '';

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

            // 处理消息内容
            if (
              streamData.event === 'message' ||
              streamData.event === 'agent_message'
            ) {
              if (streamData.answer) {
                assistantMessage += streamData.answer;

                // 发送流式内容到前端
                res.write(
                  `data: ${JSON.stringify({
                    event: streamData.event,
                    answer: streamData.answer,
                    metadata: streamData.metadata,
                  })}\n\n`,
                );
              }
            }

            // 处理消息结束事件
            if (streamData.event === 'message_end') {
              console.log('收到消息结束事件');

              // 如果消息结束事件包含知识库引用信息，也要发送给前端
              if (streamData.metadata?.retriever_resources) {
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
          console.log('Dify流结束');
          resolve();
        });

        stream.on('error', (error: Error) => {
          console.error('Dify流错误:', error);
          reject(error);
        });
      });

      console.log('Dify流式响应完成，总内容长度:', assistantMessage.length);

      // 发送结束标记
      res.write(`data: [DONE]\n\n`);

      // 保存完整的助手消息到数据库
      const savedMessage = await this.messages.append(
        conversationId,
        ChatRole.Assistant,
        assistantMessage,
      );

      return {
        messageId: savedMessage.id,
        content: assistantMessage,
      };
    } catch (error) {
      console.error('Error in generateStreamingResponse:', error);

      // 发生错误时的备用响应
      const fallbackMessage = `抱歉，处理您的请求时遇到了问题：${error instanceof Error ? error.message : '未知错误'}。请稍后再试。`;

      // 使用前端期待的格式发送错误消息
      res.write(
        `data: ${JSON.stringify({
          event: 'message',
          answer: fallbackMessage,
        })}\n\n`,
      );

      // 保存错误消息到数据库
      const savedMessage = await this.messages.append(
        conversationId,
        ChatRole.Assistant,
        fallbackMessage,
      );

      return {
        messageId: savedMessage.id,
        content: fallbackMessage,
      };
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
