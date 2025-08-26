/**
 * 信息流弹窗组件
 * 
 * 主要的信息流界面容器，支持PC端和移动端响应式设计
 */

import React, { useEffect, useState } from 'react';
import { InfoFeedCategory } from '@/types/infofeed';
import type { InfoFeed } from '@/types/infofeed';
import { useInfoFeedUI, useInfoFeedDetail } from '../hooks/useInfoFeed';
import CategoryTabs from './CategoryTabs';
import InfoFeedList from './InfoFeedList';
import InfoFeedDetail from './InfoFeedDetail';

interface InfoFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const InfoFeedModal: React.FC<InfoFeedModalProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { 
    uiState, 
    openFeedDetail, 
    closeFeedDetail, 
    switchCategory,
    prevFeed,
    nextFeed,
  } = useInfoFeedUI();

  const { 
    feed: selectedFeedDetail, 
    loading: detailLoading, 
    toggleLike,
    refresh: refreshDetail
  } = useInfoFeedDetail(uiState.selectedFeed?.id || null);

  // 动画状态：进入/退出（必须在任何条件返回之前声明，避免Hooks顺序变化）
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  // 根据 isOpen 控制进入/退出动画的初始与重置，避免关闭后再次打开状态残留
  useEffect(() => {
    if (isOpen) {
      setExiting(false);
      setEntered(false);
      const t = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(t);
    } else {
      // 重置状态，确保下次打开能正确从初始状态动画进入
      setEntered(false);
      setExiting(false);
    }
  }, [isOpen]);

  const handleRequestClose = () => {
    // 播放退出动画再调用上层 onClose
    setExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (uiState.selectedFeed) {
          closeFeedDetail();
        } else {
          handleRequestClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uiState.selectedFeed, closeFeedDetail, onClose]);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${entered && !exiting ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => {
          if (uiState.selectedFeed) {
            closeFeedDetail();
          } else {
            handleRequestClose();
          }
        }}
      />

      {/* 主要内容区域 */}
      <div className={`
        relative w-screen h-screen rounded-none overflow-hidden
        bg-white dark:bg-gray-900
        transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        origin-top-right
        ${entered && !exiting ? 'opacity-100 scale-100 translate-x-0 translate-y-0' : 'opacity-0 scale-95 translate-x-2 -translate-y-1'}
        ${className}
      `}>
        {/* 如果选中了具体信息流，显示详情 */}
        {uiState.selectedFeed && selectedFeedDetail ? (
          <InfoFeedDetail
            feed={selectedFeedDetail}
            onClose={closeFeedDetail}
            onLikeToggle={toggleLike}
            onPrev={uiState.selectedIndex && uiState.selectedIndex > 0 ? prevFeed : undefined}
            onNext={
              uiState.feedList && uiState.selectedIndex !== undefined &&
              uiState.selectedIndex < uiState.feedList.length - 1 ? nextFeed : undefined
            }
            prevTitle={
              uiState.feedList && uiState.selectedIndex !== undefined && uiState.selectedIndex > 0
                ? uiState.feedList[uiState.selectedIndex - 1].title
                : undefined
            }
            nextTitle={
              uiState.feedList && uiState.selectedIndex !== undefined &&
              uiState.selectedIndex < (uiState.feedList.length - 1)
                ? uiState.feedList[uiState.selectedIndex + 1].title
                : undefined
            }
            list={uiState.feedList}
            startIndex={uiState.selectedIndex}
            className="h-full"
          />
        ) : (
          /* 否则显示信息流列表 */
          <div className="flex flex-col h-full">
            {/* 头部区域 */}
            <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📰</div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    信息流
                  </h2>
                </div>
                
                {/* 关闭按钮 */}
                <button
                  onClick={handleRequestClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="关闭信息流"
                >
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 分类标签 */}
              <CategoryTabs
                selectedCategory={uiState.selectedCategory}
                onCategoryChange={switchCategory}
                className="pb-2"
              />
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4 md:p-6">
                <InfoFeedList
                  category={uiState.selectedCategory}
                  onItemClick={openFeedDetail}
                />
              </div>
            </div>
          </div>
        )}

        {/* 加载状态遮罩 */}
        {detailLoading && uiState.selectedFeed && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>加载中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoFeedModal;
