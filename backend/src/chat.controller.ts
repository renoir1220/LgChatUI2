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
    // 这里先实现一个模拟的流式响应
    // 实际项目中这里会调用Dify API或其他AI服务
    
    const simulatedResponse = `基于您的问题："${userMessage}"，这是一个模拟的AI回复。

在实际应用中，这里会：
1. 调用Dify API或其他AI服务
2. 处理流式响应数据
3. 解析知识库引用信息
4. 实时传输生成的内容

${knowledgeBaseId ? `当前使用知识库：${knowledgeBaseId}` : '未选择知识库'}`;

    // 开始生成助手消息
    let assistantMessage = '';
    const chunks = simulatedResponse.split('');
    
    for (let i = 0; i < chunks.length; i++) {
      assistantMessage += chunks[i];
      
      // 模拟网络延迟
      await this.sleep(50);
      
      // 发送增量内容
      this.writeSSE(res, 'message', {
        answer: chunks[i],
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