import { apiGet } from '@/features/shared/services/api';

export interface ConversationListQuery {
  page?: number;
  pageSize?: number;
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

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  pagination: PaginationInfo;
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

export interface ConversationMessagesResponse {
  conversation: ConversationInfo;
  messages: MessageDisplay[];
}

export const adminConversationApi = {
  // 获取会话列表
  async getConversationList(query: ConversationListQuery = {}): Promise<{
    success: boolean;
    data: ConversationListResponse;
  }> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.pageSize) params.append('pageSize', query.pageSize.toString());
    if (query.feedbackFilter && query.feedbackFilter !== 'all') {
      params.append('feedbackFilter', query.feedbackFilter);
    }
    if (query.knowledgeBaseId) params.append('knowledgeBaseId', query.knowledgeBaseId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.search) params.append('search', query.search);

    const url = `/api/admin/conversations${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiGet(url);
  },

  // 获取会话消息详情
  async getConversationMessages(conversationId: string): Promise<{
    success: boolean;
    data: ConversationMessagesResponse;
  }> {
    return await apiGet(`/api/admin/conversations/${conversationId}/messages`);
  },
};