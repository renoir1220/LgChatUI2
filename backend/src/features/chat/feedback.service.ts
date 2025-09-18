import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FeedbackRepository } from './repositories/feedback.repository';
import { FeedbackConfigService } from './feedback.config.service';
import { AppLoggerService } from '../../shared/services/logger.service';
import {
  MessageFeedback,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackStats,
  AdminFeedbackStats,
  MessageFeedbackType,
} from '../../types/feedback';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly feedbackConfigService: FeedbackConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 提交或更新消息反馈
   */
  async submitFeedback(
    messageId: string,
    userId: string,
    conversationId: string,
    feedbackData: CreateFeedbackDto,
  ): Promise<MessageFeedback> {
    const startTime = Date.now();
    this.logger.log(`🔍 [${feedbackData.feedbackType}] 后端开始处理反馈`, {
      messageId,
      userId,
      conversationId,
      feedbackType: feedbackData.feedbackType,
      hasRating: !!feedbackData.rating,
      hasText: !!feedbackData.feedbackText,
      tagsCount: feedbackData.feedbackTags?.length || 0,
      startTime,
    });

    try {
      // 验证用户是否有权限对此消息提供反馈
      const authCheckStart = Date.now();
      const isAuthorized = await this.feedbackRepository.isUserAuthorizedForMessage(
        messageId,
        userId,
      );
      const authCheckDuration = Date.now() - authCheckStart;
      this.logger.log(`🔍 [${feedbackData.feedbackType}] 权限检查完成`, {
        duration: `${authCheckDuration}ms`,
        isAuthorized
      });

      if (!isAuthorized) {
        throw new ForbiddenException('您没有权限对此消息提供反馈');
      }

      const dbOpStart = Date.now();
      const feedback = await this.feedbackRepository.createOrUpdate(
        messageId,
        userId,
        conversationId,
        feedbackData,
      );
      const dbOpDuration = Date.now() - dbOpStart;
      this.logger.log(`🔍 [${feedbackData.feedbackType}] 数据库操作完成`, {
        duration: `${dbOpDuration}ms`
      });

      const duration = Date.now() - startTime;
      this.logger.log(`🔍 [${feedbackData.feedbackType}] 消息反馈提交成功`, {
        feedbackId: feedback.id,
        messageId,
        userId,
        feedbackType: feedback.feedbackType,
        duration: `${duration}ms`,
      });

      return feedback;
    } catch (error) {
      this.logger.error('提交消息反馈失败', error, {
        messageId,
        userId,
        feedbackType: feedbackData.feedbackType,
      });
      throw error;
    }
  }

  /**
   * 获取用户对特定消息的反馈
   */
  async getUserFeedback(messageId: string, userId: string): Promise<MessageFeedback | null> {
    this.logger.log('查询用户反馈', { messageId, userId });

    try {
      // 验证用户权限
      const isAuthorized = await this.feedbackRepository.isUserAuthorizedForMessage(
        messageId,
        userId,
      );

      if (!isAuthorized) {
        throw new ForbiddenException('您没有权限查看此消息的反馈');
      }

      const feedback = await this.feedbackRepository.findByMessageAndUser(messageId, userId);

      this.logger.log('查询用户反馈完成', {
        messageId,
        userId,
        hasFeedback: !!feedback,
      });

      return feedback;
    } catch (error) {
      this.logger.error('查询用户反馈失败', error, { messageId, userId });
      throw error;
    }
  }

  /**
   * 更新现有反馈
   */
  async updateFeedback(
    messageId: string,
    userId: string,
    updateData: UpdateFeedbackDto,
  ): Promise<MessageFeedback> {
    this.logger.log('更新消息反馈', {
      messageId,
      userId,
      updates: Object.keys(updateData),
    });

    try {
      // 验证用户权限
      const isAuthorized = await this.feedbackRepository.isUserAuthorizedForMessage(
        messageId,
        userId,
      );

      if (!isAuthorized) {
        throw new ForbiddenException('您没有权限修改此消息的反馈');
      }

      // 检查反馈是否存在
      const existingFeedback = await this.feedbackRepository.findByMessageAndUser(
        messageId,
        userId,
      );

      if (!existingFeedback) {
        throw new NotFoundException('反馈不存在');
      }

      // 合并更新数据
      const mergedData: CreateFeedbackDto = {
        feedbackType: updateData.feedbackType || existingFeedback.feedbackType,
        rating: updateData.rating !== undefined ? updateData.rating : existingFeedback.rating,
        feedbackText: updateData.feedbackText !== undefined ? updateData.feedbackText : existingFeedback.feedbackText,
        feedbackTags: updateData.feedbackTags !== undefined ? updateData.feedbackTags : existingFeedback.feedbackTags,
      };

      const updatedFeedback = await this.feedbackRepository.createOrUpdate(
        messageId,
        userId,
        existingFeedback.conversationId,
        mergedData,
      );

      this.logger.log('消息反馈更新成功', {
        feedbackId: updatedFeedback.id,
        messageId,
        userId,
        updates: Object.keys(updateData),
      });

      return updatedFeedback;
    } catch (error) {
      this.logger.error('更新消息反馈失败', error, {
        messageId,
        userId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * 删除用户反馈
   */
  async deleteFeedback(messageId: string, userId: string): Promise<void> {
    this.logger.log('删除消息反馈', { messageId, userId });

    try {
      // 验证用户权限
      const isAuthorized = await this.feedbackRepository.isUserAuthorizedForMessage(
        messageId,
        userId,
      );

      if (!isAuthorized) {
        throw new ForbiddenException('您没有权限删除此消息的反馈');
      }

      // 检查反馈是否存在
      const existingFeedback = await this.feedbackRepository.findByMessageAndUser(
        messageId,
        userId,
      );

      if (!existingFeedback) {
        throw new NotFoundException('反馈不存在');
      }

      const success = await this.feedbackRepository.deleteFeedback(messageId, userId);

      if (!success) {
        throw new Error('删除反馈失败');
      }

      this.logger.log('消息反馈删除成功', { messageId, userId });
    } catch (error) {
      this.logger.error('删除消息反馈失败', error, { messageId, userId });
      throw error;
    }
  }

  /**
   * 获取消息的反馈统计（管理员可见）
   */
  async getMessageFeedbackStats(messageId: string): Promise<FeedbackStats | null> {
    this.logger.log('查询消息反馈统计', { messageId });

    try {
      const stats = await this.feedbackRepository.getMessageFeedbackStats(messageId);

      this.logger.log('查询消息反馈统计完成', {
        messageId,
        hasStats: !!stats,
        totalFeedbacks: stats?.totalFeedbacks || 0,
      });

      return stats;
    } catch (error) {
      this.logger.error('查询消息反馈统计失败', error, { messageId });
      throw error;
    }
  }

  /**
   * 获取管理员反馈统计（需要管理员权限）
   */
  async getAdminFeedbackStats(
    startDate?: string,
    endDate?: string,
    knowledgeBaseId?: string,
  ): Promise<AdminFeedbackStats> {
    this.logger.log('查询管理员反馈统计', {
      startDate,
      endDate,
      knowledgeBaseId,
    });

    try {
      const stats = await this.feedbackRepository.getAdminFeedbackStats(
        startDate,
        endDate,
        knowledgeBaseId,
      );

      this.logger.log('查询管理员反馈统计完成', {
        totalFeedbacks: stats.totalFeedbacks,
        averageRating: stats.averageRating,
        trendDays: stats.feedbackTrend.length,
      });

      return stats;
    } catch (error) {
      this.logger.error('查询管理员反馈统计失败', error, {
        startDate,
        endDate,
        knowledgeBaseId,
      });
      throw error;
    }
  }

  /**
   * 快速提交简单反馈（仅反馈类型）
   */
  async submitQuickFeedback(
    messageId: string,
    userId: string,
    conversationId: string,
    feedbackType: MessageFeedbackType,
  ): Promise<MessageFeedback> {
    this.logger.log('用户提交快速反馈', {
      messageId,
      userId,
      conversationId,
      feedbackType,
    });

    return this.submitFeedback(messageId, userId, conversationId, {
      feedbackType,
    });
  }

    /**
   * 获取预定义的反馈标签
   */
  getAvailableTags(): { problemTags: string[]; positiveTags: string[] } {
    return {
      problemTags: this.feedbackConfigService.getNotHelpfulTags(),
      positiveTags: this.feedbackConfigService.getHelpfulTags(),
    };
  }


  /**
   * 验证反馈数据
   */
  private validateFeedbackData(data: CreateFeedbackDto): void {
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('评分必须在1-5之间');
    }

    if (data.feedbackText && data.feedbackText.length > 1000) {
      throw new Error('反馈文本不能超过1000个字符');
    }

    if (data.feedbackTags && data.feedbackTags.length > 10) {
      throw new Error('反馈标签不能超过10个');
    }
  }
}









