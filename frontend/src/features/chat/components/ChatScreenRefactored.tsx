import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message, Button } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { useChatState } from '../hooks/useChatState';
import { useStreamChat } from '../hooks/useStreamChat';
import { useConversations } from '../hooks/useConversations';
import { useKnowledgeBases } from '../../knowledge-base/hooks/useKnowledgeBases';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { conversationApi } from '../services/chatService';
import { showApiError } from '../../shared/services/api';
import { DictionarySelector } from '../../shared/components/DictionarySelector';
import { useCustomerDict } from '../../shared/hooks/useCustomerDict';
import type { DictionaryItem } from '../../shared/components/DictionarySelector';
import { SuggestionModal } from '../../suggestions/components/SuggestionModal';
import { SuggestionListModal } from '../../suggestions/components/SuggestionListModal';

/**
 * 重构后的聊天界面组件
 * 使用自定义Hooks进行状态管理，组件职责更加清晰
 */
const ChatScreenRefactored: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // 从URL获取初始会话ID，避免刷新时闪烁
  const initialConversationFromUrl = useMemo(() => {
    const c = searchParams.get('c');
    const isValid = !!c && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(c);
    return isValid ? c : undefined;
  }, [searchParams]);

  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 客户字典状态
  const [isDictionarySelectorOpen, setIsDictionarySelectorOpen] = useState(false);
  const { dictionaries } = useCustomerDict();
  
  // 建议模态框状态
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  
  // 建议列表模态框状态
  const [isSuggestionListModalOpen, setIsSuggestionListModalOpen] = useState(false);

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
  } = useChatState(initialConversationFromUrl);

  // 首次进入某会话时的消息加载指示
  const [messagesLoading, setMessagesLoading] = useState(false);

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
    setCurrentKnowledgeBase,
    currentKnowledgeBase
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
          // 创建或定位到真实会话后，同步到URL，刷新也能保持
          const next = new URLSearchParams(searchParams);
          next.set('c', newConversationId);
          setSearchParams(next, { replace: true });
        },
        false // 标记为普通发送模式
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      showApiError(error, '发送消息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 控制输入框聚焦到末尾的信号
  const [focusAtEndSignal, setFocusAtEndSignal] = useState(0);

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
            // 同步URL
            const next = new URLSearchParams(searchParams);
            next.set('c', newConversationId);
            setSearchParams(next, { replace: true });
          },
          true // 标记为重新生成模式
        );
      } catch (error) {
        console.error('重新生成失败:', error);
        showApiError(error, '重新生成失败');
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
    setMessagesLoading(true);
    await switchConversation(conversationKey);
    setMessagesLoading(false);
    // 将当前会话同步到URL，便于刷新/分享
    const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
    const next = new URLSearchParams(searchParams);
    if (isValidUUID(conversationKey)) {
      next.set('c', conversationKey);
    } else {
      next.delete('c');
    }
    setSearchParams(next, { replace: true });
  };

  // 新建会话处理
  const handleNewConversation = () => {
    if (loading) {
      message.warning('消息发送中，请等待请求完成后再创建新会话');
      return;
    }
    createNewConversation();
    // 新建会话时移除URL中的会话参数
    const next = new URLSearchParams(searchParams);
    next.delete('c');
    setSearchParams(next, { replace: true });
  };

  // 初次加载：若URL包含会话ID，主动加载消息，避免欢迎界面闪烁
  useEffect(() => {
    if (initialConversationFromUrl && curConversation === initialConversationFromUrl) {
      setMessagesLoading(true);
      void (async () => {
        await switchConversation(initialConversationFromUrl);
        setMessagesLoading(false);
      })();
    }
    // 仅在首次挂载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 快捷操作处理
  const handleQuickAction = (action: string) => {
    // 每个功能分别指定知识库（可按需扩展/修改）
    const QUICK_ACTION_KB_MAP: Record<string, string> = {
      'readme-query': '常见问题与需求',
      'requirement-progress': '常见问题与需求',
      'similar-requirements': '常见问题与需求',
    };

    const targetKbName = QUICK_ACTION_KB_MAP[action];
    if (targetKbName) {
      const kb = knowledgeBases.find(k => k.name === targetKbName);
      if (kb) {
        if (currentKnowledgeBase !== kb.id) {
          setCurrentKnowledgeBase(kb.id);
        }
      } else {
        message.warning(`未找到“${targetKbName}”知识库`);
      }
    }

    let quickMessage = '';
    switch (action) {
      case 'readme-query':
        quickMessage = '查询参数：';
        // 设置后将焦点移动到输入末尾，便于继续输入
        // 由于受控输入，先设值再触发聚焦信号
        setTimeout(() => setFocusAtEndSignal((s) => s + 1), 0);
        break;
      case 'requirement-progress':
        // 打开客户字典选择器（优先切换至目标知识库）
        setIsDictionarySelectorOpen(true);
        return;
      case 'similar-requirements':
        quickMessage = '查询相似需求';
        setTimeout(() => setFocusAtEndSignal((s) => s + 1), 0);
        break;
      case 'suggestion':
        setIsSuggestionModalOpen(true);
        return;
      default:
        return;
    }
    setInputValue(quickMessage);
  };

  // 客户字典选择处理
  const handleDictionarySelect = async (dictionary: DictionaryItem) => {
    const progressMessage = `查询${dictionary.customerName}的需求进展情况`;
    setIsDictionarySelectorOpen(false);
    
    // 自动发送查询消息
    await handleSubmit(progressMessage);
  };

  // 删除会话处理
  const handleDeleteConversation = async (conversationKey: string) => {
    try {
      await conversationApi.deleteConversation(conversationKey);
      message.success('会话删除成功');
      
      // 如果删除的是当前会话，切换到新会话
      if (conversationKey === curConversation) {
        createNewConversation();
        const next = new URLSearchParams(searchParams);
        next.delete('c');
        setSearchParams(next, { replace: true });
      }
      
      // 刷新会话列表
      await refreshConversations();
    } catch (error) {
      console.error('删除会话失败:', error);
      showApiError(error, '删除会话失败，请重试');
    }
  };

  // 取消请求
  const handleCancel = () => {
    abortRequest();
    setLoading(false);
  };

  // 处理相机拍照
  const handleCameraCapture = async (imageDataUrl: string) => {
    // 创建用户消息，包含图片
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: '[拍照上传]',
      timestamp: new Date().toISOString(),
      image: imageDataUrl,
    };

    // 添加用户消息到聊天记录
    setMessages(prev => [...prev, userMessage]);

    // 发送消息到后端（暂时发送文本消息说明，后续可以扩展为真正的图片处理）
    const message = `我刚才拍了一张照片，请查看。`;
    await handleSubmit(message);
  };

  // 监听知识库变化，自动更新当前会话的知识库ID
  useEffect(() => {
    const updateConversationKnowledgeBase = async () => {
      // 只有在真实会话（有conversationId）且知识库存在时才更新
      if (conversationId && currentKnowledgeBase) {
        try {
          const conversationDetail = conversationDetails[conversationId];
          // 如果当前会话的知识库ID与选择的不同，或者会话还没有知识库ID，则更新
          const currentKbId = conversationDetail?.knowledgeBaseId;
          const needsUpdate = currentKbId !== currentKnowledgeBase;
          
          if (needsUpdate) {
            await conversationApi.updateConversation(conversationId, {
              knowledgeBaseId: currentKnowledgeBase
            });
            
            // 更新本地会话详情
            setConversationDetails(prev => ({
              ...prev,
              [conversationId]: {
                ...prev[conversationId],
                knowledgeBaseId: currentKnowledgeBase
              }
            }));
          }
        } catch (error) {
          console.error('更新会话知识库失败:', error);
          // 对于知识库更新失败，显示错误提示
          showApiError(error, '保存会话设置失败');
        }
      }
    };

    updateConversationKnowledgeBase();
  }, [currentKnowledgeBase, conversationId, conversationDetails, setConversationDetails]);

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

  // 欢迎页模式（无有效会话且无消息）：用于让标题/输入区与欢迎背景有自然过渡
  const isWelcomeMode = (!/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i.test(curConversation))
    && (!messages || messages.length === 0);
  const isNewConversation = curConversation === 'new';
  

  return (
    <div className="chat-container" style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
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
        minWidth: 0, // 防止flex溢出
        position: 'relative', // 为绝对定位的灯泡图标提供相对定位上下文
        backgroundImage: isWelcomeMode 
          ? 'radial-gradient(ellipse at top, #eff6ff 0%, #ffffff 50%, #e0e7ff 100%)'
          : undefined,
        backgroundAttachment: isWelcomeMode ? 'fixed' : undefined,
      }}>
        {/* 欢迎页面时的灯泡图标 */}
        {isNewConversation && (
          <Button
            type="text"
            icon={<BulbOutlined />}
            onClick={() => setIsSuggestionListModalOpen(true)}
            title="查看建议列表"
            style={{
              position: 'absolute',
              top: 16,
              right: 24,
              zIndex: 9999,
            }}
          />
        )}
        {/* 聊天标题栏（新对话时不显示） */}
        {!isNewConversation && (
          <div style={{ 
            padding: '0 24px', 
            marginBottom: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            // 明确高度对齐左侧标题栏（24px 内容 + 上下各16px 内边距 ≈ 56px）
            height: 56,
            boxSizing: 'border-box',
            paddingTop: 16,
            borderBottom: '1px solid #f0f0f0', 
            paddingBottom: 16,
            // 移动端时左侧边距与右侧一致，菜单已悬浮无需额外留白
            paddingLeft: isMobile ? '24px' : '24px',
            justifyContent: isMobile ? 'center' : 'flex-start',
            backgroundColor: '#fff',
          }}>
            <span style={{ fontWeight: 500 }}>{renderChatTitle()}</span>
            {!isMobile && <span style={{ flex: 1 }} />}
            
            {/* 标题栏内的灯泡图标 */}
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={() => setIsSuggestionListModalOpen(true)}
              title="查看建议列表"
            />
          </div>
        )}

        {/* 消息列表 */}
        <ChatMessageList
          messages={messages}
          loading={loading}
          currentKnowledgeBase={currentKnowledgeBase}
          showWelcome={!/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(curConversation)}
          messagesLoading={messagesLoading}
          onSubmit={handleSubmit}
          onRegenerate={handleRegenerate}
          onQuickAction={handleQuickAction}
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
          onCameraCapture={handleCameraCapture}
          glass={isWelcomeMode}
          focusAtEndSignal={focusAtEndSignal}
        />
      </div>
      
      {/* 客户字典选择器 */}
      <DictionarySelector
        dictionaries={dictionaries}
        isOpen={isDictionarySelectorOpen}
        onSelect={handleDictionarySelect}
        onClose={() => setIsDictionarySelectorOpen(false)}
        title="选择客户"
      />
      
      {/* 建议模态框 */}
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        onSuccess={() => {
          // 建议提交成功后的处理
          message.success('感谢您的建议！我们会认真考虑并及时回复');
        }}
      />
      
      {/* 建议列表模态框 */}
      <SuggestionListModal
        isOpen={isSuggestionListModalOpen}
        onClose={() => setIsSuggestionListModalOpen(false)}
        onCreateSuggestion={() => {
          setIsSuggestionListModalOpen(false); // 关闭建议列表
          setIsSuggestionModalOpen(true);      // 打开提建议模态框
        }}
      />
    </div>
  );
};

export default ChatScreenRefactored;
