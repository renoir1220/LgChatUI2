import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';

export interface ConversationListQuery {
  page: number;
  pageSize: number;
  feedbackFilter?: 'all' | 'liked' | 'disliked';
  knowledgeBaseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  username: string;
  lastMessageAt: string;
  messageCount: number;
  knowledgeBaseName?: string;
  likeCount: number;
  dislikeCount: number;
  hasPositiveFeedback: boolean;
  hasNegativeFeedback: boolean;
}

export interface MessageDisplay {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  userFeedback?: {
    rating: number;
    comment?: string;
    feedbackType: string;
  };
}

export interface ConversationInfo {
  id: string;
  title: string;
  username: string;
  createdAt: string;
  messageCount: number;
  knowledgeBaseName?: string;
}

@Injectable()
export class AdminConversationsService {
  private readonly logger = new AppLoggerService();

  constructor(private readonly db: LgChatUIDatabaseService) {
    this.logger.setContext('AdminConversationsService');
  }

  async getConversationList(query: ConversationListQuery) {
    const offset = (query.page - 1) * query.pageSize;
    const startRow = offset + 1;
    const endRow = offset + query.pageSize;

    // 构建WHERE条件和参数数组（使用位置参数）
    let whereConditions = ['1=1'];
    const queryParams: any[] = [startRow, endRow]; // p0, p1
    let paramIndex = 2; // 下一个参数索引

    // 反馈过滤
    if (query.feedbackFilter === 'liked') {
      whereConditions.push('feedback_stats.likeCount > 0');
    } else if (query.feedbackFilter === 'disliked') {
      whereConditions.push('feedback_stats.dislikeCount > 0');
    }

    // 知识库过滤
    if (query.knowledgeBaseId) {
      whereConditions.push(`c.KNOWLEDGE_BASE_ID = CAST(@p${paramIndex} AS int)`);
      queryParams.push(query.knowledgeBaseId);
      paramIndex++;
    }

    // 时间范围过滤
    if (query.startDate) {
      whereConditions.push(`c.CREATED_AT >= @p${paramIndex}`);
      queryParams.push(query.startDate);
      paramIndex++;
    }
    if (query.endDate) {
      whereConditions.push(`c.CREATED_AT <= @p${paramIndex}`);
      queryParams.push(query.endDate);
      paramIndex++;
    }

    // 搜索过滤
    if (query.search) {
      whereConditions.push(`(c.TITLE LIKE @p${paramIndex} OR c.USER_ID LIKE @p${paramIndex + 1})`);
      const searchPattern = `%${query.search}%`;
      queryParams.push(searchPattern, searchPattern);
      paramIndex += 2;
    }

    const whereClause = whereConditions.join(' AND ');

    // 主查询SQL（使用位置参数，移除跨库查询，使用varchar(50) GUID）
    const conversationsQuery = `
      WITH ConversationData AS (
        SELECT
          c.CONVERSATION_ID as id,
          c.TITLE as title,
          c.USER_ID as userId,
          c.CREATED_AT as lastMessageAt,
          c.USER_ID as username,
          kb.name as knowledgeBaseName,
          COUNT(m.MESSAGE_ID) as messageCount,
          ISNULL(feedback_stats.likeCount, 0) as likeCount,
          ISNULL(feedback_stats.dislikeCount, 0) as dislikeCount,
          CASE WHEN feedback_stats.likeCount > 0 THEN 1 ELSE 0 END as hasPositiveFeedback,
          CASE WHEN feedback_stats.dislikeCount > 0 THEN 1 ELSE 0 END as hasNegativeFeedback
        FROM AI_CONVERSATIONS c
        LEFT JOIN AI_MESSAGES m ON c.CONVERSATION_ID = m.CONVERSATION_ID
        LEFT JOIN AI_KNOWLEDGE_BASES kb ON c.KNOWLEDGE_BASE_ID = kb.id
        LEFT JOIN (
          SELECT
            m2.CONVERSATION_ID,
            COUNT(CASE WHEN f.FEEDBACK_TYPE = 'helpful' THEN 1 END) as likeCount,
            COUNT(CASE WHEN f.FEEDBACK_TYPE = 'not_helpful' THEN 1 END) as dislikeCount
          FROM AI_MESSAGES m2
          LEFT JOIN AI_MESSAGE_FEEDBACK f ON m2.MESSAGE_ID = f.MESSAGE_ID
          GROUP BY m2.CONVERSATION_ID
        ) feedback_stats ON c.CONVERSATION_ID = feedback_stats.CONVERSATION_ID
        WHERE ${whereClause}
        GROUP BY
          c.CONVERSATION_ID, c.TITLE, c.USER_ID, c.CREATED_AT, kb.name,
          feedback_stats.likeCount, feedback_stats.dislikeCount
      ),
      PaginatedData AS (
        SELECT *,
          ROW_NUMBER() OVER (ORDER BY lastMessageAt DESC) as RowNum,
          COUNT(*) OVER() as TotalCount
        FROM ConversationData
      )
      SELECT * FROM PaginatedData
      WHERE RowNum BETWEEN @p0 AND @p1
      ORDER BY RowNum
    `;

    this.logger.debug('执行会话列表查询', {
      whereClause,
      queryParams,
    });

    const conversations = await this.db.query(conversationsQuery, ...queryParams);

    // 获取总数（从第一行）
    const total = conversations.length > 0 ? conversations[0].TotalCount : 0;
    const totalPages = Math.ceil(total / query.pageSize);

    // 清理结果数据
    const cleanedConversations: ConversationListItem[] = conversations.map(row => ({
      id: row.id,
      title: row.title,
      username: row.username || '未知用户',
      lastMessageAt: row.lastMessageAt,
      messageCount: row.messageCount,
      knowledgeBaseName: row.knowledgeBaseName,
      likeCount: row.likeCount,
      dislikeCount: row.dislikeCount,
      hasPositiveFeedback: Boolean(row.hasPositiveFeedback),
      hasNegativeFeedback: Boolean(row.hasNegativeFeedback),
    }));

    return {
      conversations: cleanedConversations,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    };
  }

  async getConversationMessages(conversationId: string) {
    // 获取会话基本信息
    const conversationQuery = `
      SELECT
        c.CONVERSATION_ID as id,
        c.TITLE as title,
        c.USER_ID as userId,
        c.CREATED_AT as createdAt,
        c.USER_ID as username,
        kb.name as knowledgeBaseName,
        COUNT(m.MESSAGE_ID) as messageCount
      FROM AI_CONVERSATIONS c
      LEFT JOIN AI_MESSAGES m ON c.CONVERSATION_ID = m.CONVERSATION_ID
      LEFT JOIN AI_KNOWLEDGE_BASES kb ON c.KNOWLEDGE_BASE_ID = kb.id
      WHERE c.CONVERSATION_ID = @p0
      GROUP BY c.CONVERSATION_ID, c.TITLE, c.USER_ID, c.CREATED_AT, kb.name
    `;

    const conversationResult = await this.db.query(conversationQuery, conversationId);

    if (conversationResult.length === 0) {
      throw new Error('会话不存在');
    }

    const conversation: ConversationInfo = {
      id: conversationResult[0].id,
      title: conversationResult[0].title,
      username: conversationResult[0].username || '未知用户',
      createdAt: conversationResult[0].createdAt,
      messageCount: conversationResult[0].messageCount,
      knowledgeBaseName: conversationResult[0].knowledgeBaseName,
    };

    // 获取消息列表
    const messagesQuery = `
      SELECT
        m.MESSAGE_ID as id,
        m.ROLE as role,
        m.CONTENT as content,
        m.CREATED_AT as createdAt,
        f.RATING as rating,
        f.FEEDBACK_TEXT as comment,
        f.FEEDBACK_TYPE as feedbackType
      FROM AI_MESSAGES m
      LEFT JOIN AI_MESSAGE_FEEDBACK f ON m.MESSAGE_ID = f.MESSAGE_ID
      WHERE m.CONVERSATION_ID = @p0
      ORDER BY m.CREATED_AT ASC
    `;

    const messagesResult = await this.db.query(messagesQuery, conversationId);

    const messages: MessageDisplay[] = messagesResult.map(row => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
      userFeedback: row.rating ? {
        rating: row.rating,
        comment: row.comment,
        feedbackType: row.feedbackType,
      } : undefined,
    }));

    return {
      conversation,
      messages,
    };
  }
}