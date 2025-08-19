import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { useChatState } from '../hooks/useChatState';
import { useStreamChat } from '../hooks/useStreamChat';
import { useConversations } from '../hooks/useConversations';
import { useKnowledgeBases } from '../../knowledge-base/hooks/useKnowledgeBases';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { conversationApi } from '../services/chatService';

/**
 * 重构后的聊天界面组件
 * 使用自定义Hooks进行状态管理，组件职责更加清晰
 */
const ChatScreenRefactored: React.FC = () => {
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 聊天状态管理
  const {
    setMessageHistory,
    conversations,
    setConversations,
    conversationDetails,
    setConversationDetails,
    curConversation,
    setCurConversation,
    conversationId,
    setConversationId,
    messages,
    setMessages,
    loading,
    setLoading,
    attachmentsOpen,
    setAttachmentsOpen,
    attachedFiles,
    setAttachedFiles,
    inputValue,
    setInputValue,
  } = useChatState();

  // 知识库管理
  const { 
    knowledgeBases, 
    currentKnowledgeBase, 
    setCurrentKnowledgeBase, 
    loading: kbLoading 
  } = useKnowledgeBases();

  // 流式聊天处理
  const { sendMessage, abortRequest } = useStreamChat();

  // 会话管理
  const { 
    switchConversation, 
    createNewConversation, 
    refreshConversations 
  } = useConversations(
    setConversations,
    conversationDetails,
    setConversationDetails,
    setCurConversation,
    setConversationId,
    setMessages,
    setCurrentKnowledgeBase
  );

  // 发送消息处理
  const handleSubmit = async (val: string) => {
    if (!val) return;

    if (loading) {
      message.warning('请求进行中，请等待当前请求完成');
      return;
    }

    setLoading(true);

    try {
      await sendMessage(
        val,
        conversationId,
        currentKnowledgeBase,
        messages,
        setMessages,
        async (newConversationId: string) => {
          setConversationId(newConversationId);
          setCurConversation(newConversationId);
          await refreshConversations();
        },
        false // 标记为普通发送模式
      );
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重新生成消息
  const handleRegenerate = async (messageIndex: number) => {
    // 找到对应的用户消息
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === 'user') {
      const userMessage = messages[userMessageIndex].content;
      
      setLoading(true);
      
      try {
        // 删除当前助手消息及其后的所有消息，保留到用户消息为止的历史
        const truncatedMessages = messages.slice(0, messageIndex);
        setMessages(truncatedMessages);
        
        // 重新发送用户消息以生成新回复
        await sendMessage(
          userMessage,
          conversationId,
          currentKnowledgeBase,
          truncatedMessages,
          setMessages,
          async (newConversationId: string) => {
            setConversationId(newConversationId);
            setCurConversation(newConversationId);
            await refreshConversations();
          },
          true // 标记为重新生成模式
        );
      } catch (error) {
        console.error('重新生成失败:', error);
        message.error('重新生成失败');
      } finally {
        setLoading(false);
      }
    } else {
      message.error('未找到对应的用户消息');
    }
  };

  // 会话切换处理
  const handleConversationChange = async (conversationKey: string) => {
    abortRequest();
    await switchConversation(conversationKey);
  };

  // 新建会话处理
  const handleNewConversation = () => {
    if (loading) {
      message.warning('消息发送中，请等待请求完成后再创建新会话');
      return;
    }
    createNewConversation();
  };

  // 快捷操作处理
  const handleQuickAction = (action: string) => {
    let quickMessage = '';
    
    switch (action) {
      case 'readme-query':
        quickMessage = '查询参数：';
        break;
      case 'requirement-progress':
        quickMessage = '查询需求进展';
        break;
      case 'similar-requirements':
        quickMessage = '查询相似需求';
        break;
      default:
        return;
    }
    
    // 设置快捷消息到输入框
    setInputValue(quickMessage);
  };

  // 删除会话处理
  const handleDeleteConversation = async (conversationKey: string) => {
    try {
      await conversationApi.deleteConversation(conversationKey);
      message.success('会话删除成功');
      
      // 如果删除的是当前会话，切换到新会话
      if (conversationKey === curConversation) {
        createNewConversation();
      }
      
      // 刷新会话列表
      await refreshConversations();
    } catch (error) {
      console.error('删除会话失败:', error);
      message.error('删除会话失败，请重试');
    }
  };

  // 取消请求
  const handleCancel = () => {
    abortRequest();
    setLoading(false);
  };

  // 保存消息历史到本地状态
  useEffect(() => {
    if (messages?.length) {
      setMessageHistory((prev) => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages, curConversation, setMessageHistory]);

  // 渲染聊天标题
  const renderChatTitle = () => {
    let title = '新对话';
    if (curConversation && curConversation !== 'new') {
      const detail = conversationDetails[curConversation];
      title = detail?.title
        || conversations.find((c) => c.key === curConversation)?.label
        || '对话';
    }
    return title;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
      {/* 侧边栏 */}
      <ChatSidebar
        conversations={conversations}
        currentConversation={curConversation}
        loading={loading}
        onNewConversation={handleNewConversation}
        onConversationChange={handleConversationChange}
        onDeleteConversation={handleDeleteConversation}
        onRefreshConversations={refreshConversations}
      />

      {/* 主聊天区域 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // 防止flex溢出
      }}>
        {/* 聊天标题栏 */}
        <div style={{ 
          padding: '0 24px', 
          marginBottom: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          paddingTop: 12, 
          borderBottom: '1px solid #f0f0f0', 
          paddingBottom: 12,
          // 移动端时左侧边距与右侧一致，菜单已悬浮无需额外留白
          paddingLeft: isMobile ? '24px' : '24px',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          <span style={{ fontWeight: 500 }}>{renderChatTitle()}</span>
          {!isMobile && <span style={{ flex: 1 }} />}
        </div>

        {/* 消息列表 */}
        <ChatMessageList
          messages={messages}
          loading={loading}
          currentKnowledgeBase={currentKnowledgeBase}
          onSubmit={handleSubmit}
          onRegenerate={handleRegenerate}
        />

        {/* 输入区域 */}
        <ChatInput
          inputValue={inputValue}
          loading={loading}
          attachmentsOpen={attachmentsOpen}
          attachedFiles={attachedFiles}
          knowledgeBases={knowledgeBases}
          currentKnowledgeBase={currentKnowledgeBase}
          kbLoading={kbLoading}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onAttachmentsToggle={() => setAttachmentsOpen(!attachmentsOpen)}
          onFilesChange={setAttachedFiles}
          onKnowledgeBaseChange={setCurrentKnowledgeBase}
          onQuickAction={handleQuickAction}
        />
      </div>
    </div>
  );
};

export default ChatScreenRefactored;
