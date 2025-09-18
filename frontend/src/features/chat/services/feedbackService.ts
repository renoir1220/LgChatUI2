import { apiPost, apiGet, apiPut, apiDelete } from '../../shared/services/api';

// 反馈类型枚举
export enum MessageFeedbackType {
  Helpful = 'helpful',
  NotHelpful = 'not_helpful',
  PartiallyHelpful = 'partially_helpful',
}

// 基础反馈接口
export interface MessageFeedback {
  id: string;
  messageId: string;
  userId: string;
  conversationId: string;
  feedbackType: MessageFeedbackType;
  rating?: number;
  feedbackText?: string;
  feedbackTags?: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建反馈请求
export interface CreateFeedbackRequest {
  feedbackType: MessageFeedbackType;
  rating?: number;
  feedbackText?: string;
  feedbackTags?: string[];
}

// 更新反馈请求
export interface UpdateFeedbackRequest {
  feedbackType?: MessageFeedbackType;
  rating?: number;
  feedbackText?: string;
  feedbackTags?: string[];
}

// 快速反馈请求
export interface QuickFeedbackRequest {
  feedbackType: MessageFeedbackType;
}

// 反馈统计信息
export interface FeedbackStats {
  messageId: string;
  totalFeedbacks: number;
  helpfulCount: number;
  notHelpfulCount: number;
  partiallyHelpfulCount: number;
  averageRating?: number;
  commonTags: string[];
}

// 预定义标签
export interface FeedbackTags {
  problemTags: string[];
  positiveTags: string[];
}

/**
 * 消息反馈API服务
 */
export const feedbackService = {
  /**
   * 提交完整反馈
   */
  async submitFeedback(messageId: string, data: CreateFeedbackRequest): Promise<MessageFeedback> {
    return apiPost<MessageFeedback>(`/api/messages/${messageId}/feedback`, data);
  },

  /**
   * 提交快速反馈（仅反馈类型）
   */
  async submitQuickFeedback(messageId: string, data: QuickFeedbackRequest): Promise<MessageFeedback> {
    return apiPost<MessageFeedback>(`/api/messages/${messageId}/feedback/quick`, data);
  },

  /**
   * 获取用户对特定消息的反馈
   */
  async getUserFeedback(messageId: string): Promise<MessageFeedback | null> {
    try {
      return await apiGet<MessageFeedback>(`/api/messages/${messageId}/feedback`);
    } catch (error: any) {
      // 如果反馈不存在，返回null而不是抛出错误
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 更新现有反馈
   */
  async updateFeedback(messageId: string, data: UpdateFeedbackRequest): Promise<MessageFeedback> {
    return apiPut<MessageFeedback>(`/api/messages/${messageId}/feedback`, data);
  },

  /**
   * 删除用户反馈
   */
  async deleteFeedback(messageId: string): Promise<{ success: boolean; message: string }> {
    return apiDelete<{ success: boolean; message: string }>(`/api/messages/${messageId}/feedback`);
  },

  /**
   * 获取预定义反馈标签
   */
  async getAvailableTags(messageId: string): Promise<FeedbackTags> {
    return apiGet<FeedbackTags>(`/api/messages/${messageId}/feedback/tags`);
  },

  /**
   * 获取消息反馈统计（管理员功能）
   */
  async getMessageStats(messageId: string): Promise<FeedbackStats | null> {
    try {
      return await apiGet<FeedbackStats>(`/api/messages/${messageId}/feedback/stats`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};