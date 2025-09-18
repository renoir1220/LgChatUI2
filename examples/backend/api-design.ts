/**
 * 后端 API 设计示例
 * 展示 RESTful API 和流式 API 的设计模式
 */

import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

// ✅ RESTful API 设计示例
@UseGuards(JwtAuthGuard)
@Controller('api/conversations')
export class ConversationsController {
  
  // GET /api/conversations?page=1&pageSize=20
  @Get()
  async listConversations(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<Conversation>> {
    const userId = req.user.id;
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
    
    const conversations = await this.conversationsRepository.listByUser(userId, p, ps);
    
    return {
      data: conversations,
      pagination: {
        page: p,
        pageSize: ps,
        total: conversations.length
      }
    };
  }

  // POST /api/conversations
  @Post()
  async createConversation(
    @Body(new ZodValidationPipe(CreateConversationSchema)) body: CreateConversationRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<Conversation> {
    const userId = req.user.id;
    
    this.logger.log('创建新会话', { 
      userId, 
      title: body.title,
      knowledgeBaseId: body.knowledgeBaseId 
    });
    
    return await this.conversationsRepository.create({
      userId,
      title: body.title,
      knowledgeBaseId: body.knowledgeBaseId
    });
  }

  // PUT /api/conversations/:id
  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateConversationSchema)) body: UpdateConversationRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<Conversation> {
    const userId = req.user.id;
    
    // 验证所有权
    const owned = await this.messagesRepository.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }
    
    return await this.conversationsRepository.update(id, body);
  }

  // DELETE /api/conversations/:id
  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    
    // 验证所有权
    const owned = await this.messagesRepository.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }
    
    await this.conversationsRepository.delete(id);
    
    this.logger.log('会话删除成功', { conversationId: id, userId });
    
    return { success: true };
  }
}

// ✅ 流式 API 设计示例
@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChatController {
  
  // POST /api/chat - 流式聊天API
  @Post('chat')
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user.id;
    
    this.logger.log('开始处理聊天请求', {
      userId,
      messageLength: body.message.length,
      hasKnowledgeBase: !!body.knowledgeBaseId
    });

    try {
      // 设置 SSE 响应头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Conversation-ID',
        'X-Conversation-ID': body.conversationId || 'new',
      });

      // 处理流式响应
      await this.generateStreamingResponse(res, body, userId);
      
    } catch (error) {
      this.logger.error('聊天请求处理失败', error instanceof Error ? error.stack : undefined, {
        userId,
        conversationId: body.conversationId
      });
      
      // 发送错误事件
      res.write(`data: ${JSON.stringify({
        event: 'error',
        error: error instanceof Error ? error.message : '处理请求时发生错误'
      })}\n\n`);
      
    } finally {
      res.end();
    }
  }

  private async generateStreamingResponse(
    res: Response,
    request: ChatRequest,
    userId: string
  ): Promise<void> {
    // 流式响应处理逻辑
    const stream = await this.difyService.chatWithStreaming(
      request.message,
      userId,
      request.knowledgeBaseId
    );

    stream.on('data', (chunk) => {
      try {
        const data = JSON.parse(chunk.toString());
        
        if (data.event === 'message') {
          // 转发消息事件到前端
          res.write(`data: ${JSON.stringify({
            event: 'message',
            answer: data.answer
          })}\n\n`);
        }
        
        if (data.event === 'message_end') {
          // 消息结束
          res.write(`data: [DONE]\n\n`);
        }
        
      } catch (parseError) {
        this.logger.error('流数据解析失败', parseError);
      }
    });

    stream.on('error', (error) => {
      this.logger.error('流处理错误', error.stack);
      res.write(`data: ${JSON.stringify({
        event: 'error',
        error: '流处理失败'
      })}\n\n`);
    });

    stream.on('end', () => {
      this.logger.debug('流式响应结束');
    });
  }
}

// ✅ 数据验证管道示例
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new BadRequestException(`数据验证失败: ${message}`);
      }
      throw new BadRequestException('数据验证失败');
    }
  }
}

// ✅ 全局异常过滤器示例
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      error = 'Internal Server Error';
      
      this.logger.error(`未处理的错误: ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}