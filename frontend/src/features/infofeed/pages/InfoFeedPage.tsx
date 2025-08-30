import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfoFeedUI, useInfoFeedDetail } from '../hooks/useInfoFeed';
import { TabsFramework, type MenuItem } from '../../shared/components/TabsFramework';
import { InfoFeedCategory } from '@/types/infofeed';
import InfoFeedList from '../components/InfoFeedList';
import InfoFeedDetail from '../components/InfoFeedDetail';

// 信息流分类菜单配置
const INFOFEED_MENU_ITEMS: MenuItem[] = [
  {
    key: InfoFeedCategory.ALL,
    label: '所有',
    icon: <span className="text-base">📰</span>
  },
  {
    key: InfoFeedCategory.RELATED,
    label: '与我有关',
    icon: <span className="text-base">👤</span>
  },
  {
    key: InfoFeedCategory.NEWS,
    label: '新闻',
    icon: <span className="text-base">📡</span>
  },
  {
    key: InfoFeedCategory.FEATURES,
    label: '新功能',
    icon: <span className="text-base">🎉</span>
  },
  {
    key: InfoFeedCategory.KNOWLEDGE,
    label: '新知识',
    icon: <span className="text-base">💡</span>
  }
];

/**
 * 信息流独立页面
 * 使用通用TabsFramework架构
 */
const InfoFeedPage: React.FC = () => {
  const navigate = useNavigate();

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
    toggleLike
  } = useInfoFeedDetail(uiState.selectedFeed?.id || null);

  // 顶部标题（详情滚动时显示）
  const [detailTopTitle, setDetailTopTitle] = useState<string>('');
  const [detailTitleVisible, setDetailTitleVisible] = useState<boolean>(false);
  const handleDetailTitleChange = (title: string, visible: boolean) => {
    setDetailTopTitle(title);
    setDetailTitleVisible(visible);
  };

  const inDetail = !!(uiState.selectedFeed && selectedFeedDetail);

  // 处理主菜单切换
  const handleTabChange = (tabKey: string) => {
    switchCategory(tabKey as InfoFeedCategory);
  };

  // 使用 TabsFramework
  if (inDetail) {
    // 详情页面独立布局
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="flex flex-col min-h-screen">
          {/* 详情页固定头部 */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center px-4 md:px-6 h-[44px]">
              <button
                onClick={closeFeedDetail}
                className="flex items-center justify-center w-10 h-10 hover:bg-muted rounded-md transition-colors touch-manipulation"
                aria-label="返回列表"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 ml-4">
                {detailTitleVisible && (
                  <h1 className="text-lg font-medium truncate">{detailTopTitle}</h1>
                )}
              </div>
            </div>
          </div>
          
          {/* 占位空间 */}
          <div className="h-[44px]"></div>
          
          {/* 详情内容 */}
          <div className="flex-1 overflow-hidden">
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
              onTitleChange={handleDetailTitleChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // 列表页面使用 TabsFramework
  return (
    <TabsFramework
      menuItems={INFOFEED_MENU_ITEMS}
      activeTab={uiState.selectedCategory}
      onTabChange={handleTabChange}
      onBackClick={() => navigate('/')}
    >
      {(activeTab) => (
        <InfoFeedList
          category={activeTab as InfoFeedCategory}
          onItemClick={openFeedDetail}
        />
      )}
    </TabsFramework>
  );
};

export default InfoFeedPage;
