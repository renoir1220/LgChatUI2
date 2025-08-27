/**
 * 信息流列表项组件
 * 
 * 展示单个信息流条目，包含缩略图、标题、摘要、统计数据等
 */

import React from 'react';
import type { InfoFeed } from '@/types/infofeed';
import { InfoFeedCategory } from '@/types/infofeed';
import { infoFeedService } from '../services/infoFeedService';
import { Badge } from '@/components/ui/badge';
import './feed-markdown.css';

interface InfoFeedItemProps {
  feed: InfoFeed;
  onClick: (feed: InfoFeed) => void;
  className?: string;
}

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
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgFailed, setImgFailed] = React.useState(false);

  // 格式化发布时间
  const formattedTime = infoFeedService.formatPublishTime(feed.publish_time);

  return (
    <article
      className={`group relative cursor-pointer transition-all hover:bg-accent/5 active:scale-[0.995] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md ${className}`}
      onClick={() => onClick(feed)}
      tabIndex={0}
    >
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        {/* 文本区域 */}
        <div className="flex-1">
          {/* 标题 + 置顶 */}
          <div className="flex items-start gap-2 mb-1">
            {feed.is_pinned && (
              <Badge variant="secondary" className="text-[10px]">置顶</Badge>
            )}
            <h3 className="flex-1 text-[17px] md:text-[18px] font-medium leading-snug line-clamp-2 group-hover:text-primary">
              {feed.title}
            </h3>
          </div>

          {/* 摘要 */}
          {feed.summary && (
            <p className="text-sm md:text-[14px] text-muted-foreground line-clamp-2 md:line-clamp-3 mb-2 md:mb-3">
              {feed.summary}
            </p>
          )}

          {/* 元信息行 */}
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            {/* 发布时间 */}
            <time dateTime={feed.publish_time} className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedTime}</span>
            </time>

            {/* 统计数据 */}
            <div className="flex items-center gap-4">
              {/* 浏览次数 */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{feed.view_count}</span>
              </div>

              {/* 点赞次数 */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{feed.like_count}</span>
              </div>

              {/* 评论次数 */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{feed.comment_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 媒体区域（右侧，≥md），移动端置于顶部 */}
        <div className="w-full md:w-[180px] shrink-0">
          <div className="relative rounded-md overflow-hidden bg-muted aspect-video">
            {!imgLoaded && !imgFailed && <div className="feed-img-skeleton" />}
            <img
              src={thumbnailUrl}
              alt={feed.title}
              className={`feed-img-img w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${imgLoaded ? 'is-loaded' : ''}`}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                setImgFailed(true);
                const target = e.target as HTMLImageElement;
                target.src = infoFeedService.getPlaceholderThumbnail(feed.category);
              }}
            />

            {/* 分类标签（弱化色） */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-[11px]">
                {CATEGORY_LABELS[feed.category]}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default InfoFeedItem;
