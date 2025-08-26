/**
 * 信息流相关的React Hook
 * 
 * 提供信息流数据管理和状态控制的自定义Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { InfoFeedCategory } from '@/types/infofeed';
import type { 
  InfoFeed, 
  InfoFeedDetailResponse,
  InfoFeedComment,
  InfoFeedListQuery,
  InfoFeedUIState,
  CommentUIState,
  PaginatedResponse
} from '@/types/infofeed';
import { infoFeedService } from '../services/infoFeedService';

/**
 * 信息流列表Hook
 */
export function useInfoFeedList(initialQuery: InfoFeedListQuery = {}) {
  const [feeds, setFeeds] = useState<InfoFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState<InfoFeedListQuery>({
    page: 1,
    limit: 20,
    order_by: 'publish_time',
    order_direction: 'DESC',
    ...initialQuery
  });

  // 获取信息流列表
  const fetchFeeds = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const actualQuery = reset ? { ...query, page: 1 } : query;
      const result = await infoFeedService.getInfoFeedList(actualQuery);
      
      if (reset) {
        setFeeds(result.data);
        setCurrentPage(1);
      } else {
        setFeeds(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.pagination.has_next);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取信息流失败');
      console.error('获取信息流列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setQuery(prev => ({ ...prev, page: nextPage }));
  }, [hasMore, loading, currentPage]);

  // 刷新列表
  const refresh = useCallback(() => {
    setCurrentPage(1);
    setQuery(prev => ({ ...prev, page: 1 }));
    fetchFeeds(true);
  }, [fetchFeeds]);

  // 更新查询条件
  const updateQuery = useCallback((newQuery: Partial<InfoFeedListQuery>) => {
    setQuery(prev => ({ ...prev, ...newQuery, page: 1 }));
    setCurrentPage(1);
  }, []);

  // 初始加载
  useEffect(() => {
    fetchFeeds(true);
  }, [query.category, query.order_by, query.order_direction]);

  // 分页加载
  useEffect(() => {
    if (currentPage > 1) {
      fetchFeeds(false);
    }
  }, [currentPage]);

  return {
    feeds,
    loading,
    error,
    hasMore,
    currentPage,
    query,
    loadMore,
    refresh,
    updateQuery
  };
}

/**
 * 信息流详情Hook
 */
export function useInfoFeedDetail(id: number | null) {
  const [feed, setFeed] = useState<InfoFeedDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取详情
  const fetchDetail = useCallback(async (feedId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await infoFeedService.getInfoFeedDetail(feedId);
      setFeed(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取信息流详情失败');
      console.error('获取信息流详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 点赞/取消点赞
  const toggleLike = useCallback(async () => {
    if (!feed) return;
    
    try {
      const result = await infoFeedService.toggleInfoFeedLike(feed.id);
      setFeed(prev => prev ? {
        ...prev,
        is_liked: result.is_liked,
        like_count: result.like_count
      } : null);
    } catch (err) {
      console.error('点赞操作失败:', err);
      // 这里可以显示toast提示
    }
  }, [feed]);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    } else {
      setFeed(null);
    }
  }, [id, fetchDetail]);

  return {
    feed,
    loading,
    error,
    toggleLike,
    refresh: () => id && fetchDetail(id)
  };
}

/**
 * 信息流评论Hook
 */
export function useInfoFeedComments(feedId: number | null) {
  const [comments, setComments] = useState<InfoFeedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // 获取评论列表
  const fetchComments = useCallback(async (feedId: number, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const page = reset ? 1 : currentPage;
      const result = await infoFeedService.getCommentList(feedId, page);
      
      if (reset) {
        setComments(result.data);
        setCurrentPage(1);
      } else {
        setComments(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.pagination.has_next);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取评论失败');
      console.error('获取评论失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // 添加评论
  const addComment = useCallback(async (content: string, parentId?: number) => {
    if (!feedId) return;
    
    try {
      setSubmitting(true);
      await infoFeedService.createComment(feedId, { content, parent_id: parentId });
      
      // 重新加载评论列表
      fetchComments(feedId, true);
      
    } catch (err) {
      console.error('添加评论失败:', err);
      throw err; // 重新抛出以便组件处理
    } finally {
      setSubmitting(false);
    }
  }, [feedId, fetchComments]);

  // 评论点赞
  const toggleCommentLike = useCallback(async (commentId: number) => {
    try {
      const result = await infoFeedService.toggleCommentLike(commentId);
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_liked: result.is_liked, like_count: result.like_count }
          : comment
      ));
      
    } catch (err) {
      console.error('评论点赞失败:', err);
    }
  }, []);

  // 加载更多评论
  const loadMore = useCallback(() => {
    if (!hasMore || loading || !feedId) return;
    
    setCurrentPage(prev => prev + 1);
  }, [hasMore, loading, feedId]);

  // 初始加载
  useEffect(() => {
    if (feedId) {
      setCurrentPage(1);
      fetchComments(feedId, true);
    } else {
      setComments([]);
    }
  }, [feedId]);

  // 分页加载
  useEffect(() => {
    if (feedId && currentPage > 1) {
      fetchComments(feedId, false);
    }
  }, [feedId, currentPage, fetchComments]);

  return {
    comments,
    loading,
    error,
    hasMore,
    submitting,
    addComment,
    toggleCommentLike,
    loadMore,
    refresh: () => feedId && fetchComments(feedId, true)
  };
}

/**
 * 信息流UI状态Hook
 */
export function useInfoFeedUI() {
  const [uiState, setUIState] = useState<InfoFeedUIState>({
    selectedCategory: InfoFeedCategory.ALL,
    isModalOpen: false,
    selectedFeed: null,
    feedList: undefined,
    selectedIndex: undefined,
    isLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1
  });

  // 打开信息流详情
  const openFeedDetail = useCallback(
    (
      feed: InfoFeed,
      ctx?: { list: InfoFeed[]; index: number },
    ) => {
      setUIState(prev => ({
        ...prev,
        selectedFeed: feed,
        isModalOpen: true,
        feedList: ctx?.list ?? prev.feedList,
        selectedIndex: ctx?.index ?? prev.selectedIndex,
      }));
    },
    [],
  );

  // 关闭信息流详情
  const closeFeedDetail = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedFeed: null,
      feedList: prev.feedList,
      selectedIndex: prev.selectedIndex,
    }));
  }, []);

  // 切换分类
  const switchCategory = useCallback((category: InfoFeedCategory) => {
    setUIState(prev => ({
      ...prev,
      selectedCategory: category,
      currentPage: 1
    }));
  }, []);

  // 设置错误状态
  const setError = useCallback((error: string | null) => {
    setUIState(prev => ({ ...prev, error }));
  }, []);

  // 设置加载状态
  const setLoading = useCallback((isLoading: boolean) => {
    setUIState(prev => ({ ...prev, isLoading }));
  }, []);

  // 导航：跳转到指定索引
  const navigateToIndex = useCallback((index: number) => {
    setUIState(prev => {
      const list = prev.feedList || [];
      if (index < 0 || index >= list.length) return prev;
      return {
        ...prev,
        selectedIndex: index,
        selectedFeed: list[index],
        isModalOpen: true,
      };
    });
  }, []);

  const prevFeed = useCallback(() => {
    setUIState(prev => {
      const list = prev.feedList || [];
      const idx = (prev.selectedIndex ?? -1) - 1;
      if (idx < 0) return prev;
      return {
        ...prev,
        selectedIndex: idx,
        selectedFeed: list[idx],
      };
    });
  }, []);

  const nextFeed = useCallback(() => {
    setUIState(prev => {
      const list = prev.feedList || [];
      const idx = (prev.selectedIndex ?? -1) + 1;
      if (idx >= list.length) return prev;
      return {
        ...prev,
        selectedIndex: idx,
        selectedFeed: list[idx],
      };
    });
  }, []);

  return {
    uiState,
    openFeedDetail,
    closeFeedDetail,
    switchCategory,
    setError,
    setLoading,
    prevFeed,
    nextFeed,
    navigateToIndex,
  };
}
