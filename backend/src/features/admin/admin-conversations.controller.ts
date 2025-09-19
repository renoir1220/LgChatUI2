import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminConversationsService } from './admin-conversations.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AppLoggerService } from '../../shared/services/logger.service';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types';
import type {
  ConversationListQuery as ServiceConversationListQuery,
  ConversationListItem,
  ConversationInfo,
  MessageDisplay,
} from './admin-conversations.service';

// 查询参数验证Schema
const ConversationListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
  feedbackFilter: z.enum(['all', 'liked', 'disliked']).optional(),
  knowledgeBaseId: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '开始日期格式无效'
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '结束日期格式无效'
  }).optional(),
  search: z.string().optional(),
});

type ConversationListQuery = z.infer<typeof ConversationListQuerySchema>;

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin')
export class AdminConversationsController {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly conversationsService: AdminConversationsService,
  ) {
    this.logger.setContext('AdminConversationsController');
  }

  // GET /api/admin/conversations - 获取会话列表
  @Get('conversations')
  async getConversationList(
    @Query(new ZodValidationPipe(ConversationListQuerySchema)) query: ConversationListQuery,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    success: boolean;
    data: {
      conversations: ConversationListItem[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    timestamp: string;
  }> {
    this.logger.log('管理员查询会话列表', {
      adminUserId: req.user.id,
      adminUsername: req.user.username,
      queryParams: query,
    });

    try {
      const result = await this.conversationsService.getConversationList(query);

      this.logger.log('会话列表查询成功', {
        adminUserId: req.user.id,
        totalCount: result.pagination.total,
        returnedCount: result.conversations.length,
      });

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('会话列表查询失败', error.stack, {
        adminUserId: req.user.id,
        queryParams: query,
      });
      throw error;
    }
  }

  // GET /api/admin/conversations/:id/messages - 获取会话消息详情
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Param('id') conversationId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    success: boolean;
    data: {
      conversation: ConversationInfo;
      messages: MessageDisplay[];
    };
    timestamp: string;
  }> {
    this.logger.log('管理员查询会话消息详情', {
      adminUserId: req.user.id,
      adminUsername: req.user.username,
      conversationId,
    });

    try {
      const result = await this.conversationsService.getConversationMessages(conversationId);

      this.logger.log('会话消息详情查询成功', {
        adminUserId: req.user.id,
        conversationId,
        messageCount: result.messages.length,
      });

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('会话消息详情查询失败', error.stack, {
        adminUserId: req.user.id,
        conversationId,
      });
      throw error;
    }
  }
}