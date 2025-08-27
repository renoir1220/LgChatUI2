/**
 * 信息流详情组件
 * 
 * 展示信息流的完整内容，包含标题、正文、互动功能等
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './feed-markdown.css';
import { FEED_NAV_CONFIG } from '../config';
import { InfoFeedCategory } from '@/types/infofeed';
import type { InfoFeed, InfoFeedDetailResponse } from '@/types/infofeed';
import { infoFeedService } from '../services/infoFeedService';
import InfoFeedComments from './InfoFeedComments';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  onTitleChange?: (title: string, visible: boolean) => void;
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
  className = '',
  onTitleChange
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentTitle, setCurrentTitle] = useState<string>(feed.title);
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [armed, setArmed] = useState(false);
  const armTimerRef = useRef<number | null>(null);
  const [cooling, setCooling] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [stack, setStack] = useState<InfoFeedDetailResponse[]>([feed]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [baseIndex, setBaseIndex] = useState<number>(startIndex ?? 0);
  const [activeStackIndex, setActiveStackIndex] = useState<number>(0);
  const [likeAnim, setLikeAnim] = useState<Record<number, '+1' | '-1' | undefined>>({});

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

    // 更新当前标题（取视口顶部附近的文章）
    const threshold = 64; // 顶部阈值
    let activeIdx = -1;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const node = itemRefs.current[i];
      if (!node) continue;
      const top = node.offsetTop - el.scrollTop;
      if (top <= threshold) {
        activeIdx = i;
      } else {
        break;
      }
    }
    const firstTop = (itemRefs.current[0]?.offsetTop ?? 0) - el.scrollTop;
    const shouldShow = firstTop <= threshold && activeIdx >= 0;
    setShowStickyTitle(shouldShow);
    const active = activeIdx >= 0 ? stack[activeIdx] : undefined;
    const nextTitle = shouldShow && active ? active.title : '';
    if (nextTitle !== currentTitle) setCurrentTitle(nextTitle);
    // 通知父级用于 TopBar 标题切换
    if (onTitleChange) onTitleChange(nextTitle, shouldShow);
    if (activeIdx !== activeStackIndex) setActiveStackIndex(Math.max(0, activeIdx));
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
      setBaseIndex(startIndex);
      setActiveStackIndex(0);
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
        const nextMetaIndex = baseIndex + stack.length;
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
  }, [list, baseIndex, stack.length, loadingNext]);

  // 平滑滚动到指定 stack 索引
  const smoothScrollTo = (idx: number) => {
    const container = scrollRef.current;
    const target = itemRefs.current[idx];
    if (!container || !target) return;
    container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  };

  const handleNextClick = async () => {
    // 连续阅读模式：优先在本页内滚动
    if (list) {
      const nextIdx = activeStackIndex + 1;
      if (nextIdx < stack.length) {
        smoothScrollTo(nextIdx);
        return;
      }
      // 需要加载下一条
      const nextMetaIndex = baseIndex + stack.length;
      if (nextMetaIndex < (list?.length ?? 0) && !loadingNext) {
        setLoadingNext(true);
        try {
          const nextId = list[nextMetaIndex].id;
          const detail = await infoFeedService.getInfoFeedDetail(nextId);
          setStack((prev) => [...prev, detail]);
          // 等待渲染后滚动
          requestAnimationFrame(() => smoothScrollTo(nextIdx));
        } finally {
          setLoadingNext(false);
        }
        return;
      }
    }
    // 回退：调用外部回调
    onNext?.();
  };

  const handlePrevClick = async () => {
    if (list) {
      const prevIdx = activeStackIndex - 1;
      if (prevIdx >= 0) {
        smoothScrollTo(prevIdx);
        return;
      }
      // 需要加载上一条（在列表首之前）
      if ((baseIndex > 0) && !loadingPrev) {
        setLoadingPrev(true);
        try {
          const prevId = list[baseIndex - 1].id;
          const detail = await infoFeedService.getInfoFeedDetail(prevId);
          setStack((prev) => [detail, ...prev]);
          setBaseIndex((b) => b - 1);
          // 渲染后滚动到新增的顶部
          requestAnimationFrame(() => smoothScrollTo(0));
        } finally {
          setLoadingPrev(false);
        }
        return;
      }
    }
    onPrev?.();
  };

  return (
    <div className={`relative bg-white dark:bg-gray-800 ${className}`}>

      {/* 内容区域 */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {/* 连续阅读：渲染已加载的文章栈 */}
        {stack.map((item, idx) => {
          const formattedTimeEach = infoFeedService.formatPublishTime(item.publish_time);
          const fullDateTimeEach = new Date(item.publish_time).toLocaleString('zh-CN');
          return (
            <div
              key={item.id}
              ref={(el) => { itemRefs.current[idx] = el; }}
              className="px-4 md:px-6 py-6 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="mx-auto max-w-3xl">
              {/* 标签位于标题上方 */}
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[item.category]}</Badge>
                {item.is_pinned && (
                  <Badge variant="secondary" className="text-[10px]">置顶</Badge>
                )}
              </div>
              {/* 标题（主体内仍展示，顶部栏已固定显示当前标题） */}
              <h1 className="text-[22px] md:text-2xl font-semibold text-foreground mb-3">{item.title}</h1>

              {/* 元数据 */}
              <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <time dateTime={item.publish_time} title={fullDateTimeEach} className="flex items-center gap-1">
                    <span aria-hidden>📅</span> {formattedTimeEach}
                  </time>
                  <div className="flex items-center gap-1">
                    <span aria-hidden>{item.source === 'auto' ? '🤖' : '✏️'}</span>
                    <span>{item.source === 'auto' ? '自动采集' : '人工发布'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                  <button
                    onClick={async () => {
                      try {
                        const prevLiked = item.is_liked;
                        const r = await infoFeedService.toggleInfoFeedLike(item.id);
                        // 动画：根据点赞方向显示 +1 / -1
                        const delta = r.is_liked && !prevLiked ? '+1' : (!r.is_liked && prevLiked ? '-1' : undefined);
                        if (delta) {
                          setLikeAnim((m) => ({ ...m, [item.id]: delta }));
                          setTimeout(() => setLikeAnim((m) => ({ ...m, [item.id]: undefined })), 700);
                        }
                        setStack(prev => prev.map((it, i) => i === idx ? { ...it, is_liked: r.is_liked, like_count: r.like_count } : it));
                      } catch {}
                    }}
                    className="flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors"
                    title={item.is_liked ? '取消点赞' : '点赞'}
                  >
                    <svg className="w-4 h-4" fill={item.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{item.like_count}</span>
                  </button>
                  {/* +1/-1 动画标记 */}
                  {likeAnim[item.id] && (
                    <span className={`absolute -top-3 right-0 text-[10px] ${likeAnim[item.id] === '+1' ? 'text-red-500' : 'text-foreground/60'} animate-bounce`}>{likeAnim[item.id]}</span>
                  )}
                  </div>
                  <div className="hidden md:flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{item.comment_count}</span>
                  </div>
                  {/* 浏览次数移动到这里，与点赞/评论并列，仅显示图标+数字 */}
                  <div className="hidden md:flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{item.view_count}</span>
                  </div>
                </div>
              </div>

              {/* 正文内容 */}
              <div className="feed-markdown">
                <ReactMarkdown components={markdownComponents}>
                  {item.content}
                </ReactMarkdown>
              </div>

              {/* 互动区域精简后已并入元信息行 */}

              {/* 评论区域 */}
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700">
                <InfoFeedComments feedId={item.id} />
              </div>
              </div>
            </div>
          );
        })}
        {/* 悬浮 前一篇/后一篇 按钮 */}
        {/* 加载更多 sentinel */}
        <div ref={loadMoreRef} className="h-8" />
      </div>

      {/* 对齐内容列的悬浮导航（固定于可视区域，不随内容滚动） */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="mx-auto max-w-3xl h-full relative px-4 md:px-6">
          <div className="absolute right-0 bottom-4 flex flex-col gap-2">
            <button
              className="pointer-events-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/35 hover:bg-black/45 text-white backdrop-blur-sm shadow-lg transition-colors"
              aria-label="前一篇"
              onClick={handlePrevClick}
              title={prevTitle || '前一篇'}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              className="pointer-events-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/35 hover:bg-black/45 text-white backdrop-blur-sm shadow-lg transition-colors"
              aria-label="后一篇"
              onClick={handleNextClick}
              title={nextTitle || '后一篇'}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoFeedDetail;

// Markdown renderers for feed content
const markdownComponents = {
  // 1) Make <p> smart: if it only contains an image (or link-wrapped image),
  // render a block-level figure instead of a paragraph to avoid invalid nesting.
  p: ({ node, children }: any) => {
    const c: any[] = node?.children || [];
    // Filter out pure whitespace text nodes
    const meaningful = c.filter((n: any) => !(n.type === 'text' && !/\S/.test(n.value || '')));
    const onlyOne = meaningful.length === 1 ? meaningful[0] : null;
    const isImg = onlyOne?.tagName === 'img';
    const isLinkWithImg = onlyOne?.tagName === 'a' && onlyOne?.children?.length === 1 && onlyOne.children[0]?.tagName === 'img';

    if (isImg || isLinkWithImg) {
      // Extract image props
      const imgNode = isImg ? onlyOne : onlyOne.children[0];
      const linkHref = isLinkWithImg ? (onlyOne.properties?.href as string | undefined) : undefined;
      const props = imgNode?.properties || {};
      return (
        <FeedImageBlock
          src={props.src}
          alt={props.alt}
          title={props.title}
          linkHref={linkHref}
        />
      );
    }
    return <p>{children}</p>;
  },
  // 2) Default inline images inside text paragraphs must be inline-safe
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <FeedImageInline {...props} />;
  },
};

// Block figure image with shimmer skeleton and optional caption
function FeedImageBlock(
  props: React.ImgHTMLAttributes<HTMLImageElement> & { linkHref?: string }
) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const Img = (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      {...props}
      className={`feed-img-img ${loaded ? 'is-loaded' : ''}`}
      onLoad={(e) => {
        setLoaded(true);
        props.onLoad?.(e);
      }}
      onError={(e) => {
        setFailed(true);
        props.onError?.(e);
      }}
    />
  );
  return (
    <figure className="feed-img-wrapper" style={{ minHeight: 160 }}>
      {!loaded && !failed && <div className="feed-img-skeleton" />}
      {props.linkHref ? (
        <a href={props.linkHref} target="_blank" rel="noreferrer noopener">{Img}</a>
      ) : (
        Img
      )}
      {props.alt && <figcaption>{props.alt}</figcaption>}
    </figure>
  );
}

// Inline-safe image renderer to be valid inside <p>
function FeedImageInline(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  return (
    <span className="feed-img-inline">
      {!loaded && !failed && <span className="feed-img-skeleton" />}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        {...props}
        className={`feed-img-img ${loaded ? 'is-loaded' : ''}`}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          props.onError?.(e);
        }}
      />
    </span>
  );
}
