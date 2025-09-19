import { useState, useEffect, useCallback } from 'react';
import { adminConversationApi, type ConversationListQuery } from '../../../services/adminConversationApi';
import type { ConversationListItem, PaginationInfo } from '../../../services/adminConversationApi';

export interface ConversationFilters {
  feedbackFilter?: 'all' | 'liked' | 'disliked';
  knowledgeBaseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const useAdminConversations = () => {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConversationFilters>({
    feedbackFilter: 'all',
  });

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query: ConversationListQuery = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      };

      const response = await adminConversationApi.getConversationList(query);

      if (response.success) {
        setConversations(response.data.conversations);
        setPagination(response.data.pagination);
      } else {
        throw new Error('获取会话列表失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载失败');
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const updateFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    // 清空过滤条件
    if (Object.keys(newFilters).length === 0) {
      setFilters({ feedbackFilter: 'all' });
    } else {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
    // 重置到第一页
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const refreshData = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    changePageSize,
    refreshData,
  };
};