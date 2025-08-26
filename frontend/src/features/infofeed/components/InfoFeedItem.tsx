/**
 * 信息流列表项组件
 * 
 * 展示单个信息流条目，包含缩略图、标题、摘要、统计数据等
 */

import React from 'react';
import type { InfoFeed } from '@/types/infofeed';
import { InfoFeedCategory } from '@/types/infofeed';
import { infoFeedService } from '../services/infoFeedService';

interface InfoFeedItemProps {
  feed: InfoFeed;
  onClick: (feed: InfoFeed) => void;
  className?: string;
}

// 分类标签颜色配置
const CATEGORY_COLORS = {
  [InfoFeedCategory.ALL]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [InfoFeedCategory.RELATED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [InfoFeedCategory.NEWS]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [InfoFeedCategory.FEATURES]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [InfoFeedCategory.KNOWLEDGE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
};

// 分类标签文本
const CATEGORY_LABELS = {
  [InfoFeedCategory.ALL]: '全部',
  [InfoFeedCategory.RELATED]: '相关',
  [InfoFeedCategory.NEWS]: '新闻',
  [InfoFeedCategory.FEATURES]: '功能',
  [InfoFeedCategory.KNOWLEDGE]: '知识'
};

const InfoFeedItem: React.FC<InfoFeedItemProps> = ({ 
  feed, 
  onClick, 
  className = '' 
}) => {
  // 获取缩略图URL，如果没有则使用占位符
  const thumbnailUrl = feed.thumbnail_url || infoFeedService.getPlaceholderThumbnail(feed.category);

  // 格式化发布时间
  const formattedTime = infoFeedService.formatPublishTime(feed.publish_time);

  return (
    <article
      className={`
        group relative cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-sm 
        hover:shadow-md border border-gray-200 dark:border-gray-700
        transition-all duration-200 hover:transform hover:scale-[1.02]
        ${className}
      `}
      onClick={() => onClick(feed)}
    >
      {/* 置顶标识 */}
      {feed.is_pinned && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium z-10">
          置顶
        </div>
      )}

      {/* 缩略图区域 */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <img
          src={thumbnailUrl}
          alt={feed.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            // 图片加载失败时使用占位符
            const target = e.target as HTMLImageElement;
            target.src = infoFeedService.getPlaceholderThumbnail(feed.category);
          }}
        />
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* 分类标签 */}
        <div className="absolute bottom-3 left-3">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${CATEGORY_COLORS[feed.category]}
          `}>
            {CATEGORY_LABELS[feed.category]}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {feed.title}
        </h3>

        {/* 摘要 */}
        {feed.summary && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
            {feed.summary}
          </p>
        )}

        {/* 元数据行 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {/* 发布时间 */}
          <time dateTime={feed.publish_time} className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formattedTime}</span>
          </time>

          {/* 统计数据 */}
          <div className="flex items-center space-x-4">
            {/* 浏览次数 */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{feed.view_count}</span>
            </div>

            {/* 点赞次数 */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{feed.like_count}</span>
            </div>

            {/* 评论次数 */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{feed.comment_count}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default InfoFeedItem;
