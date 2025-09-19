import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ConversationFilters from './ConversationFilters';
import ConversationList from './ConversationList';
import ConversationDetail from './ConversationDetail';
import { useAdminConversations } from './hooks/useAdminConversations';

export interface ConversationFilters {
  feedbackFilter?: 'all' | 'liked' | 'disliked';
  knowledgeBaseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  username: string;
  lastMessageAt: string;
  messageCount: number;
  knowledgeBaseName?: string;
  likeCount: number;
  dislikeCount: number;
  hasPositiveFeedback: boolean;
  hasNegativeFeedback: boolean;
}

const ConversationViewerPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const {
    conversations,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    changePageSize,
    refreshData,
  } = useAdminConversations();

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">会话记录查看</h2>
        <p className="text-muted-foreground">
          查看所有用户的对话记录和反馈情况
        </p>
      </div>

      {/* 过滤器 */}
      <ConversationFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={() => updateFilters({})}
      />

      <Separator />

      {/* 主要内容区域 - 左右分栏 */}
      <div className="grid grid-cols-10 gap-6 h-[calc(100vh-300px)]">
        {/* 左侧会话列表 - 30% */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <ConversationList
                conversations={conversations}
                pagination={pagination}
                loading={loading}
                error={error}
                selectedId={selectedConversationId}
                onConversationSelect={handleConversationSelect}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                onRefresh={refreshData}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右侧消息详情 - 70% */}
        <div className="col-span-7">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <ConversationDetail
                conversationId={selectedConversationId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationViewerPage;