import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { useInfoFeedUI, useInfoFeedDetail } from '../hooks/useInfoFeed';
import CategoryTabs from '../components/CategoryTabs';
import TopBar from '../components/TopBar';
import SubHeader from '../../shared/components/SubHeader';
import InfoFeedList from '../components/InfoFeedList';
import InfoFeedDetail from '../components/InfoFeedDetail';

/**
 * 信息流独立页面
 * 将原本的 InfoFeedModal 内部主体迁移为单页布局，去除蒙层与模态逻辑。
 * 与聊天页互相跳转：右上角返回按钮回到 '/'
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

  // 页面容器（占满可视区，避免 w-screen 带来的水平溢出）
  return (
    <div className="w-full min-h-screen bg-white">
      <div className="flex flex-col min-h-screen">
        {/* TopBar 持久存在 */}
        <TopBar
          withDivider={inDetail}
          dense={inDetail}
          title={inDetail ? (detailTitleVisible ? detailTopTitle : '') : (
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-accent/40 text-primary p-1.5">
                <Newspaper className="w-4 h-4" />
              </div>
              <span>信息流</span>
            </div>
          )}
          right={
            <button
              onClick={inDetail ? closeFeedDetail : () => navigate('/')}
              className="flex items-center gap-1 px-3 py-2 min-w-[44px] min-h-[44px] justify-center hover:bg-muted rounded-md transition-colors touch-manipulation"
              aria-label="返回"
            >
              <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline text-xs text-foreground/70">{inDetail ? '返回列表' : '返回聊天'}</span>
            </button>
          }
        />

        {/* SubHeader：列表显示分类（胶囊轨道），详情隐藏 */}
        <SubHeader visible={!inDetail}>
          <CategoryTabs
            selectedCategory={uiState.selectedCategory}
            onCategoryChange={switchCategory}
          />
        </SubHeader>

        {/* 内容区域（统一滚动容器） */}
        <div className="flex-1 overflow-hidden">
          {!inDetail ? (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4 md:px-6 py-4 md:py-6">
                <InfoFeedList
                  category={uiState.selectedCategory}
                  onItemClick={openFeedDetail}
                />
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* 加载状态遮罩 */}
        {false && detailLoading && uiState.selectedFeed && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center space-x-3 text-gray-600">
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

export default InfoFeedPage;
