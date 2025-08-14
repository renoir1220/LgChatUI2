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
        conversation = await this.conversations.createConversation(userId, title);
        conversationId = conversation.id;
        console.log('新会话创建成功:', conversationId);
      } else {
        // 验证会话是否属于该用户
        console.log('验证会话所有权...');
        const owned = await this.messages.isConversationOwnedByUser(conversationId, userId);
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

      // 3. 发送用户消息确认
      console.log('发送用户消息确认到前端...');
      this.writeSSE(res, 'message', {
        type: 'user_message',
        message: userMessage,
        conversationId,
      });

      // 4. 模拟AI助手响应（流式）
      console.log('开始生成AI响应...');
      const result = await this.generateStreamingResponse(
        res,
        conversationId,
        body.message,
        body.knowledgeBaseId,
      );
      console.log('AI响应生成完成, 结果:', result);

      // 5. 发送完成事件
      console.log('发送流式响应结束事件...');
      this.writeSSE(res, 'message', {
        type: 'message',
        message: {
          id: result.messageId,
          conversationId,
          role: 'assistant',
          content: result.content,
          createdAt: new Date().toISOString(),
        },
      });
      console.log('=== 聊天请求处理完成 ===');

    } catch (error) {
      console.error('=== 聊天请求处理出错 ===');
      console.error('错误详情:', error);
      // 发送错误事件
      this.writeSSE(res, 'error', {
        error: error instanceof Error ? error.message : '处理请求时发生错误',
      });
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
  ): Promise<{messageId: string, content: string}> {
    console.log('--- generateStreamingResponse 开始 ---');
    console.log('参数: conversationId:', conversationId, 'userMessage:', userMessage, 'knowledgeBaseId:', knowledgeBaseId);
    
    try {
      // 临时使用模拟响应，避免Dify API配置问题
      console.log('使用模拟AI响应 (跳过Dify API调用)...');
      
      // 模拟流式响应
      const simulatedResponse = `基于您的问题："${userMessage}"，这是一个模拟的AI回复。

在实际应用中，这里会：
1. 调用Dify API或其他AI服务
2. 处理流式响应数据
3. 解析知识库引用信息
4. 实时传输生成的内容

${knowledgeBaseId ? `当前使用知识库：${knowledgeBaseId}` : '未选择知识库'}`;

      // 分块发送模拟响应
      const chunks = simulatedResponse.split('');
      let assistantMessage = '';
      
      for (let i = 0; i < chunks.length; i++) {
        assistantMessage += chunks[i];
        
        // 每10个字符发送一次增量内容
        if (i % 10 === 0 || i === chunks.length - 1) {
          this.writeSSE(res, 'message', {
            type: 'chunk',
            content: chunks.slice(Math.max(0, i - 9), i + 1).join(''),
          });
          
          // 模拟网络延迟
          await this.sleep(50);
        }
      }

      console.log('模拟流式响应完成，总内容长度:', assistantMessage.length);

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

      return {
        messageId: savedMessage.id,
        content: fallbackMessage,
      };
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