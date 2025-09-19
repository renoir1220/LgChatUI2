import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
// 使用简单的时间格式化函数
import type { ConversationListItem, PaginationInfo } from '../../services/adminConversationApi';

// 简单的相对时间格式化函数
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`;

  return date.toLocaleDateString('zh-CN');
};

interface ConversationListProps {
  conversations: ConversationListItem[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onConversationSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  pagination,
  loading,
  error,
  selectedId,
  onConversationSelect,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}) => {
  if (loading && conversations.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 列表头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">会话列表</span>
            <Badge variant="secondary">{pagination.total}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的会话
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedId === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  {/* 用户名和反馈 */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate flex-1">
                      {conversation.username}
                    </span>
                    <div className="flex items-center space-x-1 ml-2">
                      {conversation.hasPositiveFeedback && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-xs">{conversation.likeCount}</span>
                        </div>
                      )}
                      {conversation.hasNegativeFeedback && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <ThumbsDown className="h-3 w-3" />
                          <span className="text-xs">{conversation.dislikeCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 会话标题 */}
                  <div className="text-sm text-foreground mb-2 line-clamp-2">
                    {conversation.title}
                  </div>

                  {/* 知识库、消息数、时间 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      {conversation.knowledgeBaseName && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {conversation.knowledgeBaseName}
                        </Badge>
                      )}
                      <span>{conversation.messageCount}条消息</span>
                    </div>
                    <span>
                      {formatTimeAgo(conversation.lastMessageAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 分页控件 */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t space-y-3">
          {/* 每页大小选择 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">每页</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 分页信息 */}
          <div className="text-center text-xs text-muted-foreground">
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </div>

          {/* 分页按钮 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev || loading}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || loading}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;