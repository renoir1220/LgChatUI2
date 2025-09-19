import { Injectable } from '@nestjs/common';
import { LgChatUIDatabaseService } from '../../shared/database/database.service';
import { AppLoggerService } from '../../shared/services/logger.service';

// 简化的统计数据类型定义
export interface DailyUsageData {
  date: string;
  conversations: number;
  messages: number;
}

export interface UserRankingData {
  userHash: string;
  conversationCount: number;
  messageCount: number;
  lastActiveAt: string;
}

export interface FeedbackTrendData {
  date: string;
  helpful: number;
  notHelpful: number;
  total: number;
}

export interface ClientUsageData {
  clientType: string;
  count: number;
  percentage: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new AppLoggerService();

  constructor(private readonly db: LgChatUIDatabaseService) {
    this.logger.setContext('DashboardService');
  }

  /**
   * 1. 总用量和按天趋势
   */
  async getDailyUsageTrends(days: number = 30): Promise<DailyUsageData[]> {
    this.logger.log('获取每日用量趋势', { days });

    const query = `
      SELECT
        CAST(c.CREATED_AT AS date) as date,
        COUNT(DISTINCT c.CONVERSATION_ID) as conversations,
        COUNT(m.MESSAGE_ID) as messages
      FROM AI_CONVERSATIONS c
      LEFT JOIN AI_MESSAGES m ON c.CONVERSATION_ID = m.CONVERSATION_ID
      WHERE c.CREATED_AT >= DATEADD(day, -@p0, GETDATE())
      GROUP BY CAST(c.CREATED_AT AS date)
      ORDER BY date DESC
    `;

    const results = await this.db.query(query, days);

    return results.map(row => ({
      date: row.date.toISOString().split('T')[0],
      conversations: row.conversations,
      messages: row.messages
    }));
  }

  /**
   * 2. 按用户用量排行
   */
  async getUserRanking(limit: number = 10): Promise<UserRankingData[]> {
    this.logger.log('获取用户用量排行', { limit });

    const query = `
      SELECT TOP (@p0)
        c.USER_ID as userId,
        COUNT(DISTINCT c.CONVERSATION_ID) as conversationCount,
        COUNT(m.MESSAGE_ID) as messageCount,
        MAX(ISNULL(m.CREATED_AT, c.CREATED_AT)) as lastActiveAt
      FROM AI_CONVERSATIONS c
      LEFT JOIN AI_MESSAGES m ON c.CONVERSATION_ID = m.CONVERSATION_ID AND m.ROLE = 'USER'
      GROUP BY c.USER_ID
      ORDER BY COUNT(m.MESSAGE_ID) DESC, COUNT(DISTINCT c.CONVERSATION_ID) DESC
    `;

    const results = await this.db.query(query, limit);

    return results.map(row => ({
      userHash: row.userId, // 直接使用真实的USER_ID
      conversationCount: row.conversationCount,
      messageCount: row.messageCount,
      lastActiveAt: row.lastActiveAt.toISOString()
    }));
  }

  /**
   * 3. 评价趋势（点赞、点踩）
   */
  async getFeedbackTrends(days: number = 30): Promise<FeedbackTrendData[]> {
    this.logger.log('获取评价趋势', { days });

    const query = `
      SELECT
        CAST(f.CREATED_AT AS date) as date,
        COUNT(CASE WHEN f.FEEDBACK_TYPE = 'helpful' THEN 1 END) as helpful,
        COUNT(CASE WHEN f.FEEDBACK_TYPE = 'not_helpful' THEN 1 END) as notHelpful,
        COUNT(*) as total
      FROM AI_MESSAGE_FEEDBACK f
      WHERE f.CREATED_AT >= DATEADD(day, -@p0, GETDATE())
        AND f.IS_DELETED = 0
      GROUP BY CAST(f.CREATED_AT AS date)
      ORDER BY date DESC
    `;

    const results = await this.db.query(query, days);

    return results.map(row => ({
      date: row.date.toISOString().split('T')[0],
      helpful: row.helpful,
      notHelpful: row.notHelpful,
      total: row.total
    }));
  }

  /**
   * 4. 按客户端用量分析
   */
  async getClientUsage(): Promise<ClientUsageData[]> {
    this.logger.log('获取客户端用量分析');

    const query = `
      SELECT
        ISNULL(CLIENT_TYPE, 'unknown') as clientType,
        COUNT(*) as count
      FROM AI_MESSAGES
      WHERE ROLE = 'USER'
        AND CREATED_AT >= DATEADD(day, -30, GETDATE())
      GROUP BY CLIENT_TYPE
    `;

    const results = await this.db.query(query);
    const total = results.reduce((sum, row) => sum + row.count, 0);

    return results.map(row => ({
      clientType: row.clientType === 'unknown' ? '未知' :
                  row.clientType === 'mobile' ? '手机' :
                  row.clientType === 'desktop' ? 'PC' :
                  row.clientType === 'tablet' ? '平板' : row.clientType,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 100) : 0
    }));
  }
}