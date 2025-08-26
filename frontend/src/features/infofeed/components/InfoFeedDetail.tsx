/**
 * 信息流详情组件
 * 
 * 展示信息流的完整内容，包含标题、正文、互动功能等
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FEED_NAV_CONFIG } from '../config';
import { InfoFeedCategory } from '@/types/infofeed';
import type { InfoFeed, InfoFeedDetailResponse } from '@/types/infofeed';
import { infoFeedService } from '../services/infoFeedService';
import InfoFeedComments from './InfoFeedComments';

interface InfoFeedDetailProps {
  feed: InfoFeedDetailResponse;
  onClose: () => void;
  onLikeToggle: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  prevTitle?: string;
  nextTitle?: string;
  // 连续阅读上下文（可选）
  list?: InfoFeed[];
  startIndex?: number;
  className?: string;
}

// 分类配置
const CATEGORY_CONFIG = {
  [InfoFeedCategory.ALL]: { icon: '📰', color: 'bg-blue-500' },
  [InfoFeedCategory.RELATED]: { icon: '👤', color: 'bg-green-500' },
  [InfoFeedCategory.NEWS]: { icon: '📡', color: 'bg-red-500' },
  [InfoFeedCategory.FEATURES]: { icon: '🎉', color: 'bg-purple-500' },
  [InfoFeedCategory.KNOWLEDGE]: { icon: '💡', color: 'bg-yellow-500' }
};

// 分类标签
const CATEGORY_LABELS = {
  [InfoFeedCategory.ALL]: '全部',
  [InfoFeedCategory.RELATED]: '相关',
  [InfoFeedCategory.NEWS]: '新闻',
  [InfoFeedCategory.FEATURES]: '功能',
  [InfoFeedCategory.KNOWLEDGE]: '知识'
};

const InfoFeedDetail: React.FC<InfoFeedDetailProps> = ({
  feed,
  onClose,
  onLikeToggle,
  onPrev,
  onNext,
  prevTitle,
  nextTitle,
  list,
  startIndex,
  className = ''
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [armed, setArmed] = useState(false);
  const armTimerRef = useRef<number | null>(null);
  const [cooling, setCooling] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [stack, setStack] = useState<InfoFeedDetailResponse[]>([feed]);
  const [loadingNext, setLoadingNext] = useState(false);

  // 处理点赞
  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await onLikeToggle();
    } finally {
      setIsLiking(false);
    }
  };

  // 格式化发布时间
  const formattedTime = infoFeedService.formatPublishTime(feed.publish_time);
  const fullDateTime = new Date(feed.publish_time).toLocaleString('zh-CN');

  // 获取分类配置
  const categoryConfig = CATEGORY_CONFIG[feed.category];
  const categoryLabel = CATEGORY_LABELS[feed.category];

  const truncate = (text?: string, max: number = 20) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  };

  // 监听滚动到底部
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - FEED_NAV_CONFIG.bottomOffsetPx;
    setAtBottom(nearBottom);
    if (!nearBottom && armed) {
      setArmed(false);
      if (armTimerRef.current) {
        window.clearTimeout(armTimerRef.current);
        armTimerRef.current = null;
      }
    }
  };

  // 两步确认翻页（旧方案保留，用于没有列表上下文时触发 next 回调）
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    // 如果有连续阅读上下文，则不使用旧方案
    if (list && startIndex !== undefined) return;
    if (!onNext || cooling) return;
    if (e.deltaY <= 0) return;
    if (!atBottom) return;

    if (!armed) {
      if (e.deltaY >= FEED_NAV_CONFIG.armThresholdDeltaY) {
        setArmed(true);
        if (armTimerRef.current) window.clearTimeout(armTimerRef.current);
        armTimerRef.current = window.setTimeout(() => {
          setArmed(false);
          armTimerRef.current = null;
        }, FEED_NAV_CONFIG.confirmWindowMs);
      }
      return;
    }

    setArmed(false);
    if (armTimerRef.current) {
      window.clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
    onNext();
    setCooling(true);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setTimeout(() => {
      setCooling(false);
      cooldownTimerRef.current = null;
    }, FEED_NAV_CONFIG.navigationCooldownMs);
  };

  // 切换文章后，回到顶部并重置状态
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: FEED_NAV_CONFIG.autoScrollBehavior });
    }
    setAtBottom(false);
    setArmed(false);
    // 如果是连续阅读模式，重置栈
    if (list && startIndex !== undefined) {
      setStack([feed]);
    }
  }, [feed.id, list, startIndex]);

  useEffect(() => () => {
    if (armTimerRef.current) window.clearTimeout(armTimerRef.current);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
  }, []);

  // 连续阅读：观察底部 sentinel，追加下一篇
  useEffect(() => {
    if (!list || startIndex === undefined) return;
    const root = scrollRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        // 是否还有下一条
        const nextMetaIndex = (startIndex ?? 0) + stack.length;
        if (nextMetaIndex >= list.length) return;
        if (loadingNext) return;
        setLoadingNext(true);
        try {
          const nextId = list[nextMetaIndex].id;
          const detail = await infoFeedService.getInfoFeedDetail(nextId);
          setStack((prev) => [...prev, detail]);
        } finally {
          setLoadingNext(false);
        }
      },
      { root, rootMargin: '0px 0px 200px 0px', threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [list, startIndex, stack.length, loadingNext]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* 头部区域 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{categoryConfig.icon}</span>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${categoryConfig.color}`}>
              {categoryLabel}
            </span>
            {feed.is_pinned && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                置顶
              </span>
            )}
          </div>
        </div>
        
        {/* 返回按钮（返回到信息流列表） */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="返回列表"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">返回</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        ref={scrollRef}
        className="h-[calc(100vh-64px)] overflow-y-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {/* 连续阅读：渲染已加载的文章栈 */}
        {stack.map((item, idx) => {
          const formattedTimeEach = infoFeedService.formatPublishTime(item.publish_time);
          const fullDateTimeEach = new Date(item.publish_time).toLocaleString('zh-CN');
          return (
            <div key={item.id} className="p-6 border-b border-gray-200 dark:border-gray-700">
              {/* 标题 */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {item.title}
              </h1>

              {/* 元数据 */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center space-x-4">
                  <time dateTime={item.publish_time} title={fullDateTimeEach}>
                    📅 {formattedTimeEach}
                  </time>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{item.view_count} 浏览</span>
                  </div>
                </div>

                {/* 来源标识 */}
                <div className="flex items-center space-x-1">
                  {item.source === 'auto' ? '🤖' : '✏️'}
                  <span>{item.source === 'auto' ? '自动采集' : '人工发布'}</span>
                </div>
              </div>

              {/* 正文内容 */}
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {item.content}
                </ReactMarkdown>
              </div>

              {/* 互动区域 */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={async () => {
                    try {
                      const r = await infoFeedService.toggleInfoFeedLike(item.id);
                      setStack(prev => prev.map((it, i) => i === idx ? { ...it, is_liked: r.is_liked, like_count: r.like_count } : it));
                    } catch {}
                  }}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all
                    ${item.is_liked ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}
                  `}
                >
                  <svg className="w-5 h-5" fill={item.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{item.like_count}</span>
                </button>

                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{item.comment_count} 评论</span>
                  </div>
                </div>
              </div>

              {/* 评论区域 */}
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700">
                <InfoFeedComments feedId={item.id} />
              </div>
            </div>
          );
        })}
        {/* 加载更多 sentinel */}
        <div ref={loadMoreRef} className="h-8" />
      </div>
    </div>
  );
};

export default InfoFeedDetail;
