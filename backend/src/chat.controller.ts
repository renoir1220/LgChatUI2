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
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { DifyService } from './services/dify.service';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import {
  ChatRequestSchema,
  ChatRole,
} from '@lg/shared';
import type {
  ChatRequest,
  ChatMessage,
  Conversation,
} from '@lg/shared';

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
    const username = req.user.username;
    const userId = `user_${username}`;

    // 设置流式响应headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      // 1. 获取或创建会话
      let conversationId = body.conversationId;
      let conversation: Conversation;

      if (!conversationId) {
        // 创建新会话
        const title = this.generateConversationTitle(body.message);
        conversation = await this.conversations.createConversation(userId, title);
        conversationId = conversation.id;
      } else {
        // 验证会话是否属于该用户
        const owned = await this.messages.isConversationOwnedByUser(conversationId, userId);
        if (!owned) {
          throw new BadRequestException('Conversation not found');
        }
      }

      // 2. 保存用户消息
      const userMessage = await this.messages.append(
        conversationId,
        ChatRole.User,
        body.message,
        userId,
      );

      // 3. 发送用户消息确认
      this.writeSSE(res, 'user_message', {
        message: userMessage,
        conversationId,
      });

      // 4. 模拟AI助手响应（流式）
      const assistantMessageId = await this.generateStreamingResponse(
        res,
        conversationId,
        body.message,
        body.knowledgeBaseId,
      );

      // 5. 发送完成事件
      this.writeSSE(res, 'message_end', {
        conversationId,
        messageId: assistantMessageId,
      });

    } catch (error) {
      // 发送错误事件
      this.writeSSE(res, 'error', {
        error: error instanceof Error ? error.message : '处理请求时发生错误',
      });
    } finally {
      res.end();
    }
  }

  private async generateStreamingResponse(
    res: express.Response,
    conversationId: string,
    userMessage: string,
    knowledgeBaseId?: string,
  ): Promise<string> {
    try {
      // 调用 Dify API 获取流式响应
      const stream = await this.difyService.chatWithStreaming(
        userMessage,
        `user_${conversationId}`, // 使用会话ID作为用户标识
        knowledgeBaseId,
        conversationId,
      );

      if (!stream) {
        throw new Error('Failed to get stream from Dify API');
      }

      let assistantMessage = '';
      let difyChatId = '';
      let difyConversationId = '';

      // 处理流式数据
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;

            const parsed = this.difyService.parseDifyStreamLine(line);
            if (!parsed) continue;

            // 处理不同类型的事件
            switch (parsed.event) {
              case 'message':
                if (parsed.answer) {
                  assistantMessage += parsed.answer;
                  this.writeSSE(res, 'message', {
                    answer: parsed.answer,
                    content: assistantMessage,
                  });
                }
                if (parsed.message_id) {
                  difyChatId = parsed.message_id;
                }
                if (parsed.conversation_id) {
                  difyConversationId = parsed.conversation_id;
                }
                break;
              
              case 'message_end':
                // 流式响应结束
                break;
              
              case 'error':
                console.error('Dify API error:', parsed);
                throw new Error('Dify API returned error');
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 如果没有收到任何内容，使用备用响应
      if (!assistantMessage) {
        assistantMessage = '抱歉，我暂时无法为您提供回复。请稍后再试。';
        this.writeSSE(res, 'message', {
          answer: assistantMessage,
          content: assistantMessage,
        });
      }

      // 保存完整的助手消息到数据库
      const savedMessage = await this.messages.append(
        conversationId,
        ChatRole.Assistant,
        assistantMessage,
      );

      return savedMessage.id;

    } catch (error) {
      console.error('Error in generateStreamingResponse:', error);
      
      // 发生错误时的备用响应
      const fallbackMessage = `抱歉，处理您的请求时遇到了问题：${error instanceof Error ? error.message : '未知错误'}。请稍后再试。`;
      
      this.writeSSE(res, 'message', {
        answer: fallbackMessage,
        content: fallbackMessage,
      });

      // 保存错误消息到数据库
      const savedMessage = await this.messages.append(
        conversationId,
        ChatRole.Assistant,
        fallbackMessage,
      );

      return savedMessage.id;
    }
  }

  private generateConversationTitle(firstMessage: string): string {
    // 简单的标题生成逻辑，取前20个字符
    const title = firstMessage.length > 20 
      ? firstMessage.substring(0, 20) + '...' 
      : firstMessage;
    return title;
  }

  private writeSSE(res: express.Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}