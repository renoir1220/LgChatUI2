/**
 * 信息流列表组件
 * 
 * 展示信息流列表，支持分页加载和虚拟滚动优化
 */

import React, { useEffect } from 'react';
import type { InfoFeed } from '@/types/infofeed';
import { InfoFeedCategory } from '@/types/infofeed';
import { useInfoFeedList } from '../hooks/useInfoFeed';
import InfoFeedItem from './InfoFeedItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface InfoFeedListProps {
  category?: InfoFeedCategory;
  onItemClick: (feed: InfoFeed, ctx?: { list: InfoFeed[]; index: number }) => void;
  className?: string;
}

const InfoFeedList: React.FC<InfoFeedListProps> = ({
  category = InfoFeedCategory.ALL,
  onItemClick,
  className = ''
}) => {
  const {
    feeds,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    updateQuery
  } = useInfoFeedList({ category });

  // 当分类改变时更新查询
  useEffect(() => {
    updateQuery({ category });
  }, [category, updateQuery]);

  // 处理滚动加载更多
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // 当滚动到底部附近时加载更多
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      loadMore();
    }
  };

  // 加载状态（shadcn 风格 Skeleton）
  if (loading && feeds.length === 0) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        <div className="divide-y divide-border">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="px-4 py-4">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
                <div className="w-full md:w-[180px]">
                  <Skeleton className="w-full aspect-video" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl">⚠️</div>
        <h3 className="text-lg font-semibold text-foreground">加载失败</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error}
        </p>
        <Button variant="outline" onClick={refresh}>重试</Button>
      </div>
    );
  }

  // 空状态
  if (!loading && feeds.length === 0) {
    const emptyMessages = {
      [InfoFeedCategory.ALL]: { icon: '📰', text: '暂无信息流内容' },
      [InfoFeedCategory.RELATED]: { icon: '👤', text: '暂无相关内容' },
      [InfoFeedCategory.NEWS]: { icon: '📡', text: '暂无新闻内容' },
      [InfoFeedCategory.FEATURES]: { icon: '🎉', text: '暂无新功能发布' },
      [InfoFeedCategory.KNOWLEDGE]: { icon: '💡', text: '暂无知识分享' }
    };

    const emptyContent = emptyMessages[category];

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl">{emptyContent.icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{emptyContent.text}</h3>
        <p className="text-muted-foreground text-center">我们会尽快为您带来更多精彩内容</p>
      </div>
    );
  }

  return (
    <div
      className={`max-w-3xl mx-auto ${className}`}
      onScroll={handleScroll}
    >
      {/* 信息流列表（单列，分隔线） */}
      <div className="divide-y divide-border">
        {feeds.map((feed, index) => (
          <div key={feed.id} className="px-4 py-4">
            <InfoFeedItem
              feed={feed}
              onClick={(f) => onItemClick(f, { list: feeds, index })}
            />
          </div>
        ))}
      </div>

      {/* 加载更多指示器 */}
      {loading && feeds.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>加载更多...</span>
          </div>
        </div>
      )}

      {/* 没有更多内容 */}
      {!hasMore && feeds.length > 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-px bg-border" />
            <span className="text-sm">已加载全部内容</span>
            <div className="w-8 h-px bg-border" />
          </div>
        </div>
      )}

      {/* 回到顶部按钮 */}
      {feeds.length > 6 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-200 z-50"
          aria-label="回到顶部"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default InfoFeedList;
