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
} from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import type {
  Conversation,
  ChatMessage,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@lg/shared';

interface AuthenticatedRequest {
  user: {
    username: string;
  };
}

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
    const username = req.user.username;
    // 与 UsersRepository 生成 userId 的方式保持一致
    const userId = `user_${username}`;
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
    const username = req.user.username;
    const userId = `user_${username}`;
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
    const username = req.user.username;
    const userId = `user_${username}`;

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
    const username = req.user.username;
    const userId = `user_${username}`;

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
    const username = req.user.username;
    const userId = `user_${username}`;

    // 检查会话是否属于该用户
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }

    // 更新会话信息
    await this.conversations.updateConversation(id, body);
    return { success: true };
  }

  // POST /api/conversations/:id/rename - 重命名会话
  @Post('conversations/:id/rename')
  async renameConversation(
    @Param('id') id: string,
    @Body() body: { title: string },
    @Request() req: AuthenticatedRequest,
  ): Promise<Conversation> {
    const username = req.user.username;
    const userId = `user_${username}`;

    // 检查会话是否属于该用户
    const owned = await this.messages.isConversationOwnedByUser(id, userId);
    if (!owned) {
      throw new NotFoundException('Conversation not found');
    }

    // 更新会话标题
    await this.conversations.updateConversation(id, { title: body.title });
    
    // 返回更新后的会话
    const conversations = await this.conversations.listByUser(userId, 1, 100);
    const updatedConversation = conversations.find(c => c.id === id);
    
    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found after update');
    }
    
    return updatedConversation;
  }
}
