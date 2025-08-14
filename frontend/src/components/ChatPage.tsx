import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConversationList } from './ConversationList';
import { WelcomeScreen } from './WelcomeScreen';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { PanelLeftOpen, PanelLeftClose, Settings, User } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { useMessageActions, useConversationActions } from '@/hooks/useChatActions';
import { useSettings } from '@/contexts/SettingsContext';
import { useNotification } from '@/contexts/NotificationContext';

interface ChatPageProps {
  className?: string;
}

export function ChatPage({ className }: ChatPageProps) {
  // 使用上下文和Hook
  const { state, actions } = useChatContext();
  const { settings } = useSettings();
  const { success, error } = useNotification();
  const messageActions = useMessageActions();
  const conversationActions = useConversationActions();

  const {
    conversations,
    currentConversation,
    messages,
    streamingContent,
    knowledgeBases,
    selectedKnowledgeBase,
    sidebarOpen,
    isLoading,
    isStreaming,
  } = state;

  // 处理发送消息
  const handleSendMessage = async (content: string) => {
    try {
      await actions.sendMessage(content);
      if (settings.enableNotifications) {
        success('消息发送成功');
      }
    } catch {
      error('消息发送失败', '请检查网络连接后重试');
    }
  };

  // 处理选择会话
  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      actions.selectConversation(conversation);
    } catch {
      error('加载会话失败', '请重试');
    }
  };

  // 处理新建会话
  const handleNewConversation = () => {
    conversationActions.newConversation();
  };

  // 处理删除会话
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      conversationActions.deleteConversation(conversationId);
      success('会话删除成功');
    } catch {
      error('删除会话失败');
    }
  };

  // 处理重命名会话
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      conversationActions.renameConversation(conversationId, newTitle);
      success('会话重命名成功');
    } catch {
      error('重命名失败');
    }
  };

  // 处理消息操作
  const handleCopyMessage = async (content: string) => {
    try {
      await messageActions.copyMessage(content);
      success('已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    try {
      await messageActions.regenerateMessage(messageId);
    } catch {
      error('重新生成失败');
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    await messageActions.likeMessage(messageId);
  };

  const handleDislikeMessage = async (messageId: string) => {
    await messageActions.dislikeMessage(messageId);
  };

  const handleStopGeneration = () => {
    messageActions.stopGeneration();
  };

  return (
    <div className={cn('flex h-screen bg-white', className)}>
      {/* 侧边栏 */}
      <div className={cn(
        'border-r border-gray-200 bg-gray-50 transition-all duration-300',
        sidebarOpen ? 'w-80' : 'w-0'
      )}>
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* 侧边栏头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">聊天记录</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="text-xs"
              >
                新建对话
              </Button>
            </div>

            {/* 会话列表 */}
            <div className="flex-1 overflow-hidden">
              <ConversationList
                conversations={conversations}
                currentConversationId={currentConversation?.id}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={handleRenameConversation}
              />
            </div>

            {/* 侧边栏底部 */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <User className="w-4 h-4 mr-2" />
                个人中心
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {/* 侧边栏切换按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={actions.toggleSidebar}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </Button>

            {/* 当前会话标题 */}
            {currentConversation && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">
                  {currentConversation.title}
                </span>
              </div>
            )}
          </div>

          {/* 知识库选择器 */}
          <KnowledgeBaseSelector
            knowledgeBases={knowledgeBases}
            selectedKnowledgeBase={selectedKnowledgeBase}
            onSelectKnowledgeBase={actions.selectKnowledgeBase}
            className="flex-shrink-0"
          />
        </div>

        {/* 聊天内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <WelcomeScreen onQuickPrompt={handleSendMessage} />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onCopy={handleCopyMessage}
              onRegenerate={handleRegenerateMessage}
              onLike={handleLikeMessage}
              onDislike={handleDislikeMessage}
              className="flex-1"
            />
          )}

          {/* 输入区域 */}
          <div className="border-t border-gray-200 bg-white p-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              disabled={isStreaming}
              isStreaming={isStreaming}
              placeholder={
                selectedKnowledgeBase 
                  ? `基于 ${knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name} 提问...`
                  : '输入消息...'
              }
            />
            
            {/* 输入提示 */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              按 Enter 发送消息，Shift + Enter 换行
              {selectedKnowledgeBase && (
                <span className="ml-2 text-blue-600">
                  · 已选择知识库: {knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}