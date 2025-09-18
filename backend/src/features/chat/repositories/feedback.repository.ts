import { Injectable, Logger } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../../shared/database/database.service';
import {
  MessageFeedback,
  MessageFeedbackType,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackStats,
  AdminFeedbackStats,
} from '../../../types/feedback';

@Injectable()
export class FeedbackRepository {
  private readonly logger = new Logger(FeedbackRepository.name);

  constructor(private readonly db: LgChatUIDatabaseService) {}

  async createOrUpdate(
    messageId: string,
    userId: string,
    conversationId: string,
    feedbackData: CreateFeedbackDto,
  ): Promise<MessageFeedback> {
    const { feedbackType, rating, feedbackText, feedbackTags } = feedbackData;
    const tagsJson = feedbackTags ? JSON.stringify(feedbackTags) : null;

    this.logger.log('创建或更新消息反馈', {
      messageId,
      userId,
      feedbackType,
      hasRating: !!rating,
      hasText: !!feedbackText,
      tagsCount: feedbackTags?.length || 0,
    });

    const rows = await this.db.query<{
      feedbackId: string;
      messageId: string;
      userId: string;
      conversationId: string;
      feedbackType: string;
      rating: number | null;
      feedbackText: string | null;
      feedbackTags: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      `
      DECLARE @currentTime datetime = GETDATE();

      IF EXISTS (SELECT 1 FROM AI_MESSAGE_FEEDBACK WHERE MESSAGE_ID = @p0 AND USER_ID = @p1)
      BEGIN
        UPDATE AI_MESSAGE_FEEDBACK
        SET
          FEEDBACK_TYPE = @p3,
          RATING = @p4,
          FEEDBACK_TEXT = @p5,
          FEEDBACK_TAGS = @p6,
          IS_DELETED = 0,
          UPDATED_AT = @currentTime
        WHERE MESSAGE_ID = @p0 AND USER_ID = @p1;
      END
      ELSE
      BEGIN
        INSERT INTO AI_MESSAGE_FEEDBACK (
          FEEDBACK_ID, MESSAGE_ID, USER_ID, CONVERSATION_ID,
          FEEDBACK_TYPE, RATING, FEEDBACK_TEXT, FEEDBACK_TAGS,
          CREATED_AT, UPDATED_AT, IS_DELETED
        ) VALUES (
          NEWID(), @p0, @p1, @p2,
          @p3, @p4, @p5, @p6,
          @currentTime, @currentTime, 0
        );
      END

      SELECT
        CONVERT(varchar(36), FEEDBACK_ID) AS feedbackId,
        CONVERT(varchar(36), MESSAGE_ID) AS messageId,
        USER_ID AS userId,
        CONVERT(varchar(36), CONVERSATION_ID) AS conversationId,
        FEEDBACK_TYPE AS feedbackType,
        RATING AS rating,
        FEEDBACK_TEXT AS feedbackText,
        FEEDBACK_TAGS AS feedbackTags,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM AI_MESSAGE_FEEDBACK
      WHERE MESSAGE_ID = @p0 AND USER_ID = @p1 AND IS_DELETED = 0;
      `,
      messageId,
      userId,
      conversationId,
      feedbackType,
      rating,
      feedbackText,
      tagsJson,
    );
    const result = rows[0];
    return {
      id: result.feedbackId,
      messageId: result.messageId,
      userId: result.userId,
      conversationId: result.conversationId,
      feedbackType: result.feedbackType as MessageFeedbackType,
      rating: result.rating || undefined,
      feedbackText: result.feedbackText || undefined,
      feedbackTags: result.feedbackTags ? JSON.parse(result.feedbackTags) : undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async findByMessageAndUser(
    messageId: string,
    userId: string,
  ): Promise<MessageFeedback | null> {
    const rows = await this.db.query<{
      feedbackId: string;
      messageId: string;
      userId: string;
      conversationId: string;
      feedbackType: string;
      rating: number | null;
      feedbackText: string | null;
      feedbackTags: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      `
      SELECT
        CONVERT(varchar(36), FEEDBACK_ID) AS feedbackId,
        CONVERT(varchar(36), MESSAGE_ID) AS messageId,
        USER_ID AS userId,
        CONVERT(varchar(36), CONVERSATION_ID) AS conversationId,
        FEEDBACK_TYPE AS feedbackType,
        RATING AS rating,
        FEEDBACK_TEXT AS feedbackText,
        FEEDBACK_TAGS AS feedbackTags,
        CONVERT(varchar(33), CREATED_AT, 126) AS createdAt,
        CONVERT(varchar(33), UPDATED_AT, 126) AS updatedAt
      FROM AI_MESSAGE_FEEDBACK
      WHERE MESSAGE_ID = @p0 AND USER_ID = @p1 AND IS_DELETED = 0
      `,
      messageId,
      userId,
    );

    if (rows.length === 0) {
      return null;
    }

    const result = rows[0];
    return {
      id: result.feedbackId,
      messageId: result.messageId,
      userId: result.userId,
      conversationId: result.conversationId,
      feedbackType: result.feedbackType as MessageFeedbackType,
      rating: result.rating || undefined,
      feedbackText: result.feedbackText || undefined,
      feedbackTags: result.feedbackTags ? JSON.parse(result.feedbackTags) : undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async getMessageFeedbackStats(messageId: string): Promise<FeedbackStats | null> {
    const rows = await this.db.query<{
      messageId: string;
      totalFeedbacks: number;
      helpfulCount: number;
      notHelpfulCount: number;
      partiallyHelpfulCount: number;
      averageRating: number | null;
      commonTags: string | null;
    }>(
      `
      SELECT
        CONVERT(varchar(36), @p0) AS messageId,
        COUNT(*) AS totalFeedbacks,
        SUM(CASE WHEN FEEDBACK_TYPE = 'helpful' THEN 1 ELSE 0 END) AS helpfulCount,
        SUM(CASE WHEN FEEDBACK_TYPE = 'not_helpful' THEN 1 ELSE 0 END) AS notHelpfulCount,
        SUM(CASE WHEN FEEDBACK_TYPE = 'partially_helpful' THEN 1 ELSE 0 END) AS partiallyHelpfulCount,
        AVG(CAST(RATING AS FLOAT)) AS averageRating,
        STRING_AGG(FEEDBACK_TAGS, ',') AS commonTags
      FROM AI_MESSAGE_FEEDBACK
      WHERE MESSAGE_ID = @p0 AND IS_DELETED = 0
      `,
      messageId,
    );

    if (rows.length === 0 || rows[0].totalFeedbacks === 0) {
      return null;
    }

    const result = rows[0];

    // 处理标签统计
    let commonTags: string[] = [];
    if (result.commonTags) {
      const allTagsStr = result.commonTags;
      const tagCounts: Record<string, number> = {};

      // 解析所有标签并统计频次
      const tagArrays = allTagsStr.split(',').map(tagsStr => {
        try {
          return tagsStr ? JSON.parse(tagsStr) : [];
        } catch {
          return [];
        }
      }).filter(Array.isArray);

      tagArrays.forEach(tags => {
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // 获取最常见的标签
      commonTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
    }

    return {
      messageId: result.messageId,
      totalFeedbacks: result.totalFeedbacks,
      helpfulCount: result.helpfulCount,
      notHelpfulCount: result.notHelpfulCount,
      partiallyHelpfulCount: result.partiallyHelpfulCount,
      averageRating: result.averageRating || undefined,
      commonTags,
    };
  }

  async getAdminFeedbackStats(
    startDate?: string,
    endDate?: string,
    knowledgeBaseId?: string,
  ): Promise<AdminFeedbackStats> {
    let whereClause = 'WHERE f.IS_DELETED = 0';
    const params: any[] = [];
    let paramIndex = 0;

    if (startDate) {
      whereClause += ` AND f.CREATED_AT >= @p${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND f.CREATED_AT <= @p${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // TODO: 当有知识库筛选需求时，需要关联消息表获取知识库信息
    if (knowledgeBaseId) {
      this.logger.warn('知识库筛选功能暂未实现', { knowledgeBaseId });
    }

    const [statsRows, trendRows] = await Promise.all([
      // 基础统计
      this.db.query<{
        totalFeedbacks: number;
        helpfulCount: number;
        notHelpfulCount: number;
        partiallyHelpfulCount: number;
        averageRating: number | null;
        allTags: string | null;
      }>(
        `
        SELECT
          COUNT(*) AS totalFeedbacks,
          SUM(CASE WHEN FEEDBACK_TYPE = 'helpful' THEN 1 ELSE 0 END) AS helpfulCount,
          SUM(CASE WHEN FEEDBACK_TYPE = 'not_helpful' THEN 1 ELSE 0 END) AS notHelpfulCount,
          SUM(CASE WHEN FEEDBACK_TYPE = 'partially_helpful' THEN 1 ELSE 0 END) AS partiallyHelpfulCount,
          AVG(CAST(RATING AS FLOAT)) AS averageRating,
          STRING_AGG(FEEDBACK_TAGS, '|') AS allTags
        FROM AI_MESSAGE_FEEDBACK f
        ${whereClause}
        `,
        ...params,
      ),

      // 趋势数据（最近30天）
      this.db.query<{
        date: string;
        count: number;
      }>(
        `
        SELECT
          CONVERT(varchar(10), f.CREATED_AT, 120) AS date,
          COUNT(*) AS count
        FROM AI_MESSAGE_FEEDBACK f
        ${whereClause}
        AND f.CREATED_AT >= DATEADD(day, -30, GETDATE())
        GROUP BY CONVERT(varchar(10), f.CREATED_AT, 120)
        ORDER BY date DESC
        `,
        ...params,
      ),
    ]);

    const stats = statsRows[0] || {
      totalFeedbacks: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      partiallyHelpfulCount: 0,
      averageRating: null,
      allTags: null,
    };

    // 处理标签统计
    const problemTags: Array<{ tag: string; count: number }> = [];
    const positiveTags: Array<{ tag: string; count: number }> = [];

    if (stats.allTags) {
      const tagCounts: Record<string, number> = {};

      stats.allTags.split('|').forEach(tagsStr => {
        if (tagsStr) {
          try {
            const tags = JSON.parse(tagsStr);
            if (Array.isArray(tags)) {
              tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          } catch (error) {
            this.logger.warn('解析反馈标签失败', { tagsStr, error: error.message });
          }
        }
      });

      // 简单分类：包含"错误"、"问题"等关键词的归为问题标签
      Object.entries(tagCounts).forEach(([tag, count]) => {
        if (tag.includes('错误') || tag.includes('问题') || tag.includes('不') || tag.includes('无关')) {
          problemTags.push({ tag, count });
        } else {
          positiveTags.push({ tag, count });
        }
      });

      // 按出现次数排序
      problemTags.sort((a, b) => b.count - a.count);
      positiveTags.sort((a, b) => b.count - a.count);
    }

    return {
      totalFeedbacks: stats.totalFeedbacks,
      feedbacksByType: {
        [MessageFeedbackType.Helpful]: stats.helpfulCount,
        [MessageFeedbackType.NotHelpful]: stats.notHelpfulCount,
        [MessageFeedbackType.PartiallyHelpful]: stats.partiallyHelpfulCount,
      },
      averageRating: stats.averageRating || 0,
      commonProblemTags: problemTags.slice(0, 10),
      commonPositiveTags: positiveTags.slice(0, 10),
      feedbackTrend: trendRows,
    };
  }

  async deleteFeedback(messageId: string, userId: string): Promise<boolean> {
    this.logger.log('删除消息反馈', { messageId, userId });

    try {
      await this.db.query(
        `
        UPDATE AI_MESSAGE_FEEDBACK
        SET IS_DELETED = 1, UPDATED_AT = GETDATE()
        WHERE MESSAGE_ID = @p0 AND USER_ID = @p1 AND IS_DELETED = 0
        `,
        messageId,
        userId,
      );

      // 检查是否删除成功
      const checkRows = await this.db.query<{ count: number }>(
        `
        SELECT COUNT(*) AS count
        FROM AI_MESSAGE_FEEDBACK
        WHERE MESSAGE_ID = @p0 AND USER_ID = @p1 AND IS_DELETED = 1
        `,
        messageId,
        userId,
      );

      return checkRows[0]?.count > 0;
    } catch (error) {
      this.logger.error('删除消息反馈失败', error, { messageId, userId });
      return false;
    }
  }

  async isUserAuthorizedForMessage(
    messageId: string,
    userId: string,
  ): Promise<boolean> {
    this.logger.log('检查用户消息权限', { messageId, userId });

    // 首先检查消息是否存在
    const messageCheck = await this.db.query<{
      conversationId: string;
      messageRole: string;
    }>(
      `
      SELECT
        CONVERT(varchar(36), CONVERSATION_ID) AS conversationId,
        ROLE AS messageRole
      FROM AI_MESSAGES
      WHERE MESSAGE_ID = @p0
      `,
      messageId,
    );

    if (messageCheck.length === 0) {
      this.logger.warn('消息不存在', { messageId, userId });
      return false;
    }

    const conversationId = messageCheck[0].conversationId;
    this.logger.log('消息详情', {
      messageId,
      conversationId,
      messageRole: messageCheck[0].messageRole
    });

    // 先查询对话的实际所有者，不进行用户过滤
    const conversationOwnerCheck = await this.db.query<{
      userId: string;
      conversationTitle: string;
      createdAt: string;
    }>(
      `
      SELECT
        c.USER_ID as userId,
        c.TITLE as conversationTitle,
        CONVERT(varchar(33), c.CREATED_AT, 126) as createdAt
      FROM AI_CONVERSATIONS c
      WHERE c.CONVERSATION_ID = @p0
      `,
      conversationId,
    );

    // 检查用户是否拥有对话
    const rows = await this.db.query<{
      count: number;
      conversationUserId: string;
    }>(
      `
      SELECT
        COUNT(*) AS count,
        MAX(c.USER_ID) AS conversationUserId
      FROM AI_MESSAGES m
      INNER JOIN AI_CONVERSATIONS c ON m.CONVERSATION_ID = c.CONVERSATION_ID
      WHERE m.MESSAGE_ID = @p0 AND c.USER_ID = @p1
      `,
      messageId,
      userId,
    );

    const isAuthorized = rows[0]?.count > 0;
    const actualOwner = conversationOwnerCheck[0];

    this.logger.log('权限检查详情', {
      messageId,
      userId,
      conversationId,
      isAuthorized,
      actualOwner: actualOwner ? {
        userId: actualOwner.userId,
        title: actualOwner.conversationTitle,
        createdAt: actualOwner.createdAt
      } : 'CONVERSATION_NOT_FOUND',
      userIdMatch: actualOwner ? (actualOwner.userId === userId) : false,
      conversationUserId: rows[0]?.conversationUserId || 'NOT_FOUND',
    });

    return isAuthorized;
  }
}

