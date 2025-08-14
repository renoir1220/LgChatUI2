import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConversationList } from './ConversationList';
import { WelcomeScreen } from './WelcomeScreen';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { PanelLeftOpen, PanelLeftClose, Settings, User } from 'lucide-react';
import type { 
  ChatMessage, 
  Conversation, 
  KnowledgeBase
} from '@lg/shared';

interface ChatPageProps {
  className?: string;
}

export function ChatPage({ className }: ChatPageProps) {
  // 状态管理
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // 模拟数据（后续将替换为真实API调用）
  useEffect(() => {
    // 模拟加载会话列表
    setConversations([
      {
        id: '1',
        title: '关于React开发的讨论',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
        message_count: 5,
      },
      {
        id: '2',
        title: 'TypeScript最佳实践',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: 'user-1',
        message_count: 3,
      },
    ]);

    // 模拟加载知识库
    setKnowledgeBases([
      {
        id: 'kb-1',
        name: '技术文档',
        description: '包含各种技术文档和API参考',
        enabled: true,
      },
      {
        id: 'kb-2',
        name: '项目手册',
        description: '项目相关的规范和指南',
        enabled: true,
      },
      {
        id: 'kb-3',
        name: '历史归档',
        description: '已归档的旧文档',
        enabled: false,
      },
    ]);
  }, []);

  // 处理发送消息
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: currentConversation?.id || 'new',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsStreaming(true);

    try {
      // 如果没有当前会话，创建新会话
      if (!currentConversation) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
          message_count: 1,
        };
        setCurrentConversation(newConversation);
        setConversations(prev => [newConversation, ...prev]);
      }

      // 模拟AI回复（后续替换为真实API调用）
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          conversation_id: currentConversation?.id || 'new',
          role: 'assistant',
          content: '这是一个模拟的AI回复。实际实现中，这里会调用真实的聊天API。',
          created_at: new Date().toISOString(),
          citations: selectedKnowledgeBase ? [
            {
              source: '示例文档.pdf',
              content: '这是一个示例引用内容，展示知识库的引用功能。',
              document_name: '示例文档',
              score: 0.85,
              dataset_id: selectedKnowledgeBase,
              document_id: 'doc-1',
              segment_id: 'seg-1',
              position: 1,
            },
          ] : undefined,
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(false);
      }, 2000);

    } catch (error) {
      console.error('发送消息失败:', error);
      setIsStreaming(false);
    }
  };

  // 处理选择会话
  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setIsLoading(true);

    try {
      // 模拟加载会话消息
      setTimeout(() => {
        const mockMessages: ChatMessage[] = [
          {
            id: '1',
            conversation_id: conversation.id,
            role: 'user',
            content: '你好，请介绍一下React的核心概念。',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            conversation_id: conversation.id,
            role: 'assistant',
            content: 'React是一个用于构建用户界面的JavaScript库，主要有以下核心概念：\n\n1. **组件（Components）**：React应用由组件构成\n2. **JSX**：JavaScript的语法扩展\n3. **Props**：组件间的数据传递\n4. **State**：组件内部状态管理\n5. **生命周期**：组件的创建、更新、销毁过程',
            created_at: new Date(Date.now() - 3500000).toISOString(),
            citations: [
              {
                source: 'React官方文档',
                content: 'React是一个用于构建用户界面的JavaScript库...',
                document_name: 'React文档',
                score: 0.92,
                dataset_id: 'kb-1',
                document_id: 'react-doc-1',
                segment_id: 'intro-1',
                position: 1,
              },
            ],
          },
        ];
        setMessages(mockMessages);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('加载会话失败:', error);
      setIsLoading(false);
    }
  };

  // 处理新建会话
  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  // 处理删除会话
  const handleDeleteConversation = async (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      handleNewConversation();
    }
  };

  // 处理重命名会话
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
    );
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  // 处理消息操作
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    // 重新生成消息的逻辑
    console.log('重新生成消息:', messageId);
  };

  const handleLikeMessage = async (messageId: string) => {
    // 点赞消息的逻辑
    console.log('点赞消息:', messageId);
  };

  const handleDislikeMessage = async (messageId: string) => {
    // 点踩消息的逻辑
    console.log('点踩消息:', messageId);
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
            onSelectKnowledgeBase={setSelectedKnowledgeBase}
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