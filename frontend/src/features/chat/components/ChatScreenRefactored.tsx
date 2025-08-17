import React, { useEffect } from 'react';
import { message } from 'antd';
import { useChatState } from '../hooks/useChatState';
import { useStreamChat } from '../hooks/useStreamChat';
import { useConversations } from '../hooks/useConversations';
import { useKnowledgeBases } from '../../knowledge-base/hooks/useKnowledgeBases';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

/**
 * 重构后的聊天界面组件
 * 使用自定义Hooks进行状态管理，组件职责更加清晰
 */
const ChatScreenRefactored: React.FC = () => {
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
        }
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
      
      // 清空当前AI回复内容，准备重新生成
      setMessages(prev => prev.map((item, i) => 
        i === messageIndex ? { ...item, content: '', citations: [] } : item
      ));
      
      setLoading(true);
      
      try {
        // TODO: 实现重新生成逻辑，这里需要特殊的处理
        // 暂时使用普通发送消息的逻辑
        console.log('重新生成消息:', userMessage);
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* 侧边栏 */}
      <ChatSidebar
        conversations={conversations}
        currentConversation={curConversation}
        loading={loading}
        onNewConversation={handleNewConversation}
        onConversationChange={handleConversationChange}
      />

      {/* 主聊天区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 聊天标题栏 */}
        <div style={{ 
          padding: '0 24px', 
          marginBottom: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          paddingTop: 12, 
          borderBottom: '1px solid #f0f0f0', 
          paddingBottom: 12 
        }}>
          <span style={{ fontWeight: 500 }}>{renderChatTitle()}</span>
          <span style={{ flex: 1 }} />
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
        />
      </div>
    </div>
  );
};

export default ChatScreenRefactored;