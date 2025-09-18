import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { MessagesRepository } from './repositories/messages.repository';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import {
  CreateFeedbackRequestSchema,
  UpdateFeedbackRequestSchema,
  MessageFeedbackTypeSchema,
  type CreateFeedbackDto,
  type UpdateFeedbackDto,
  type MessageFeedback,
  type MessageFeedbackType,
  type FeedbackStats,
  type AdminFeedbackStats,
} from '../../types/feedback';
import type { Request as ExpressRequest } from 'express';

@Controller('api/messages/:messageId/feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  /**
   * 提交或更新消息反馈
   */
  @Post()
  async submitFeedback(
    @Param('messageId') messageId: string,
    @Body(new ZodValidationPipe(CreateFeedbackRequestSchema))
    feedbackData: CreateFeedbackDto,
    @Request() req: ExpressRequest & { user?: { id?: string } },
  ): Promise<MessageFeedback> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('用户信息缺失');
    }

    // 这里需要获取conversationId，可以通过messageId查询
    // 暂时使用空字符串，实际应该从数据库查询
    const conversationId = await this.getConversationIdByMessageId(messageId);

    return this.feedbackService.submitFeedback(
      messageId,
      userId,
      conversationId,
      feedbackData,
    );
  }

  /**
   * 快速反馈（仅反馈类型）
   */
  @Post('quick')
  async submitQuickFeedback(
    @Param('messageId') messageId: string,
    @Body() body: { feedbackType: MessageFeedbackType },
    @Request() req: ExpressRequest & { user?: { id?: string } },
  ): Promise<MessageFeedback> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('用户信息缺失');
    }

    // 验证反馈类型
    const feedbackType = MessageFeedbackTypeSchema.parse(body.feedbackType);
    const conversationId = await this.getConversationIdByMessageId(messageId);

    return this.feedbackService.submitQuickFeedback(
      messageId,
      userId,
      conversationId,
      feedbackType,
    );
  }

  /**
   * 获取用户对特定消息的反馈
   */
  @Get()
  async getUserFeedback(
    @Param('messageId') messageId: string,
    @Request() req: ExpressRequest & { user?: { id?: string } },
  ): Promise<MessageFeedback | null> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('用户信息缺失');
    }

    return this.feedbackService.getUserFeedback(messageId, userId);
  }

  /**
   * 更新现有反馈
   */
  @Put()
  async updateFeedback(
    @Param('messageId') messageId: string,
    @Body(new ZodValidationPipe(UpdateFeedbackRequestSchema))
    updateData: UpdateFeedbackDto,
    @Request() req: ExpressRequest & { user?: { id?: string } },
  ): Promise<MessageFeedback> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('用户信息缺失');
    }

    return this.feedbackService.updateFeedback(messageId, userId, updateData);
  }

  /**
   * 删除用户反馈
   */
  @Delete()
  async deleteFeedback(
    @Param('messageId') messageId: string,
    @Request() req: ExpressRequest & { user?: { id?: string } },
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('用户信息缺失');
    }

    await this.feedbackService.deleteFeedback(messageId, userId);
    return { success: true, message: '反馈删除成功' };
  }

  /**
   * 获取消息反馈统计（管理员可见）
   */
  @Get('stats')
  @UseGuards(AdminGuard)
  async getMessageFeedbackStats(
    @Param('messageId') messageId: string,
  ): Promise<FeedbackStats | null> {
    return this.feedbackService.getMessageFeedbackStats(messageId);
  }

  /**
   * 获取预定义反馈标签
   */
  @Get('tags')
  getAvailableTags(): { problemTags: string[]; positiveTags: string[] } {
    return this.feedbackService.getAvailableTags();
  }

  /**
   * 辅助方法：通过消息ID获取会话ID
   */
  private async getConversationIdByMessageId(messageId: string): Promise<string> {
    // 查询消息获取会话ID
    const rows = await this.messagesRepository['db'].query<{
      conversationId: string;
    }>(
      `SELECT CONVERT(varchar(36), CONVERSATION_ID) AS conversationId
       FROM AI_MESSAGES
       WHERE MESSAGE_ID = @p0`,
      messageId,
    );

    if (rows.length === 0) {
      throw new NotFoundException('消息不存在');
    }

    return rows[0].conversationId;
  }
}

// 单独的管理员反馈统计控制器
@Controller('api/admin/feedback')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * 获取管理员反馈统计
   */
  @Get('stats')
  async getAdminFeedbackStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('knowledgeBaseId') knowledgeBaseId?: string,
  ): Promise<AdminFeedbackStats> {
    return this.feedbackService.getAdminFeedbackStats(
      startDate,
      endDate,
      knowledgeBaseId,
    );
  }

  /**
   * 获取反馈趋势数据
   */
  @Get('trends')
  async getFeedbackTrends(
    @Query('days') days: string = '30',
    @Query('knowledgeBaseId') knowledgeBaseId?: string,
  ): Promise<{ date: string; count: number }[]> {
    const numDays = parseInt(days, 10) || 30;
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000).toISOString();

    const stats = await this.feedbackService.getAdminFeedbackStats(
      startDate,
      endDate,
      knowledgeBaseId,
    );

    return stats.feedbackTrend;
  }

  /**
   * 获取问题标签统计
   */
  @Get('problem-tags')
  async getProblemTagsStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '10',
  ): Promise<Array<{ tag: string; count: number }>> {
    const stats = await this.feedbackService.getAdminFeedbackStats(
      startDate,
      endDate,
    );

    const limitNum = parseInt(limit, 10) || 10;
    return stats.commonProblemTags.slice(0, limitNum);
  }

  /**
   * 获取积极标签统计
   */
  @Get('positive-tags')
  async getPositiveTagsStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '10',
  ): Promise<Array<{ tag: string; count: number }>> {
    const stats = await this.feedbackService.getAdminFeedbackStats(
      startDate,
      endDate,
    );

    const limitNum = parseInt(limit, 10) || 10;
    return stats.commonPositiveTags.slice(0, limitNum);
  }

  /**
   * 导出反馈数据（CSV格式）
   */
  @Get('export')
  async exportFeedbackData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: string = 'json',
  ): Promise<any> {
    const stats = await this.feedbackService.getAdminFeedbackStats(
      startDate,
      endDate,
    );

    if (format === 'csv') {
      // TODO: 实现CSV格式导出
      throw new Error('CSV导出功能待实现');
    }

    return {
      exportDate: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalFeedbacks: stats.totalFeedbacks,
        averageRating: stats.averageRating,
        feedbacksByType: stats.feedbacksByType,
      },
      trends: stats.feedbackTrend,
      problemTags: stats.commonProblemTags,
      positiveTags: stats.commonPositiveTags,
    };
  }
}