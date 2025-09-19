import { apiGet } from '@/features/shared/services/api';

// 简化的统计数据类型定义
export interface DailyUsageData {
  date: string;
  conversations: number;
  messages: number;
}

export interface UserRankingData {
  userHash: string; // 实际存储的是真实的USER_ID
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

// API响应包装类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: any;
  timestamp?: string;
}

/**
 * 简化的Dashboard API服务
 */
export const dashboardApi = {
  /**
   * 1. 总用量和按天趋势
   */
  async getDailyUsage(days = 30): Promise<DailyUsageData[]> {
    const response = await apiGet<ApiResponse<DailyUsageData[]>>(
      `/api/admin/dashboard/daily-usage?days=${days}`
    );
    return response.data;
  },

  /**
   * 2. 按用户用量排行
   */
  async getUserRanking(limit = 10): Promise<UserRankingData[]> {
    const response = await apiGet<ApiResponse<UserRankingData[]>>(
      `/api/admin/dashboard/user-ranking?limit=${limit}`
    );
    return response.data;
  },

  /**
   * 3. 评价趋势（点赞、点踩）
   */
  async getFeedbackTrends(days = 30): Promise<FeedbackTrendData[]> {
    const response = await apiGet<ApiResponse<FeedbackTrendData[]>>(
      `/api/admin/dashboard/feedback-trends?days=${days}`
    );
    return response.data;
  },

  /**
   * 4. 按客户端用量分析
   */
  async getClientUsage(): Promise<ClientUsageData[]> {
    const response = await apiGet<ApiResponse<ClientUsageData[]>>(
      '/api/admin/dashboard/client-usage'
    );
    return response.data;
  }
};