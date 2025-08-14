import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import type { Conversation } from '@lg/shared';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading?: boolean;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading = false,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  className,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = (conversationId: string) => {
    if (editingTitle.trim() && editingTitle !== conversations.find(c => c.id === conversationId)?.title) {
      onRenameConversation?.(conversationId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* 头部 - 新建对话按钮 */}
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          新建对话
        </Button>
      </div>

      {/* 对话列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无对话记录</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                isEditing={editingId === conversation.id}
                editingTitle={editingTitle}
                onSelect={() => onSelectConversation(conversation.id)}
                onStartEdit={() => handleStartEdit(conversation)}
                onSaveEdit={() => handleSaveEdit(conversation.id)}
                onCancelEdit={handleCancelEdit}
                onDelete={() => onDeleteConversation?.(conversation.id)}
                onEditingTitleChange={setEditingTitle}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        共 {conversations.length} 个对话
      </div>
    </div>
  );
}

// 单个对话项组件
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditingTitleChange: (title: string) => void;
  formatDate: (date: string) => string;
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editingTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditingTitleChange,
  formatDate,
}: ConversationItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        isActive 
          ? 'bg-blue-50 border border-blue-200' 
          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
      )}
      onClick={isEditing ? undefined : onSelect}
    >
      {/* 对话图标 */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
      )}>
        <MessageSquare className="w-4 h-4" />
      </div>

      {/* 对话信息 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onSaveEdit}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(conversation.updatedAt || conversation.createdAt)}
            </p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={onStartEdit} className="text-sm">
              <Edit2 className="w-3 h-3 mr-2" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete} 
              className="text-sm text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}