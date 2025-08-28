import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  Delete,
  Post,
  Body,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { extractUserIdFromRequest } from '../../shared/utils/user.utils';
import type {
  Conversation,
  ChatMessage,
  CreateConversationRequest,
  UpdateConversationRequest,
  AuthenticatedRequest,
} from '../../types';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChatHistoryController {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
  ) {}

  // GET /api/conversations?page=1&pageSize=20
  @Get('conversations')
  async listConversations(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<Conversation[]> {
    const userId = extractUserIdFromRequest(req);
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return await this.conversations.listByUser(userId, p, ps);
  }

  // GET /api/conversations/:id/messages?page=1&pageSize=50
  @Get('conversations/:id/messages')
  async listMessages(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ): Promise<ChatMessage[]> {
    const userId = extractUserIdFromRequest(req);
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(200, Math.max(1, Number(pageSize) || 50));
    return await this.messages.listByConversation(id, p, ps);
  }

  // 兼容 Python 实现：GET /api/conversations/:id 返回该会话消息
  @Get('conversations/:id')
  async getConversationMessages(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ): Promise<ChatMessage[]> {
    return await this.listMessages(id, req, page, pageSize);
  }

  // DELETE /api/conversations/:id - 删除会话
  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = extractUserIdFromRequest(req);

    // 检查会话是否属于该用户
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }

    // 删除会话（这里需要在ConversationsRepository中实现delete方法）
    await this.conversations.deleteConversation(id);
    return { success: true };
  }

  // POST /api/conversations - 创建新会话
  @Post('conversations')
  async createConversation(
    @Body() body: CreateConversationRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<Conversation> {
    const userId = extractUserIdFromRequest(req);

    const title = body.title || '新对话';
    return await this.conversations.createConversation(
      userId,
      title,
      body.knowledgeBaseId,
    );
  }

  // PUT /api/conversations/:id - 更新会话信息
  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() body: UpdateConversationRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = extractUserIdFromRequest(req);

    // 检查会话是否属于该用户
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }

    // 允许修改知识库（前端已有确认逻辑处理）

    // 更新会话信息（允许标题、知识库、后续可扩展 modelId 等）
    await this.conversations.updateConversation(id, body as any);
    return { success: true };
  }

  // POST /api/conversations/:id/rename - 重命名会话
  @Post('conversations/:id/rename')
  async renameConversation(
    @Param('id') id: string,
    @Body() body: { title: string },
    @Request() req: AuthenticatedRequest,
  ): Promise<Conversation> {
    const userId = extractUserIdFromRequest(req);

    // 检查会话是否属于该用户
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }

    // 更新会话标题
    await this.conversations.updateConversation(id, { title: body.title });

    // 返回更新后的会话
    const conversations = await this.conversations.listByUser(userId, 1, 100);
    const updatedConversation = conversations.find((c) => c.id === id);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found after update');
    }

    return updatedConversation;
  }
}
