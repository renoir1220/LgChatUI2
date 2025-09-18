import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Button } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { useChatState } from '../hooks/useChatState';
import { useStreamChat } from '../hooks/useStreamChat';
import { useConversations } from '../hooks/useConversations';
import { useKnowledgeBases } from '../../knowledge-base/hooks/useKnowledgeBases';
import { useKnowledgeBaseSwitch } from '../hooks/useKnowledgeBaseSwitch';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { api, conversationApi } from '../services/chatService';
import { showApiError } from '../../shared/services/api';
import { DictionarySelector } from '../../shared/components/DictionarySelector';
import { useCustomerDict } from '../../shared/hooks/useCustomerDict';
import type { DictionaryItem } from '../../shared/components/DictionarySelector';
import { SuggestionModal } from '../../suggestions/components/SuggestionModal';
import { SuggestionListModal } from '../../suggestions/components/SuggestionListModal';
import { BugReportModal } from '../../bugs/components/BugReportModal';
import InfoFeedEntry from '../../infofeed/components/InfoFeedEntry';
import CustomerInfoEntry from '../../customer/components/CustomerInfoEntry';
import { isValidUUID } from '../../shared/utils/uuid';
import { QUICK_ACTION_KB_NAME_MAP, KB_NAME_REQUIREMENTS } from '../constants';

/**
 * 重构后的聊天界面组件
 * 使用自定义Hooks进行状态管理，组件职责更加清晰
 */
const ChatScreenRefactored: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // 从URL获取初始会话ID，避免刷新时闪烁
  const initialConversationFromUrl = useMemo(() => {
    const c = searchParams.get('c') || undefined;
    return isValidUUID(c) ? c : undefined;
  }, [searchParams]);

  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 客户字典状态
  const [isDictionarySelectorOpen, setIsDictionarySelectorOpen] = useState(false);
  // 客户站点查询字典选择器状态
  const [isCustomerSitesDictOpen, setIsCustomerSitesDictOpen] = useState(false);
  const { dictionaries } = useCustomerDict();
  
  // 建议模态框状态
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  
  // 建议列表模态框状态
  const [isSuggestionListModalOpen, setIsSuggestionListModalOpen] = useState(false);
  
  // BUG提交模态框状态
  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);
  
  const navigate = useNavigate();

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
  // 模型列表与选择
  const [models, setModels] = useState<{ id: string; displayName: string; modelName?: string; isDefault?: boolean }[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);

  // 知识库切换逻辑
  const { handleKnowledgeBaseSwitch } = useKnowledgeBaseSwitch();

  // 处理知识库切换（从ChatInput调用）
  const handleKnowledgeBaseChange = async (kbId: string) => {
    await handleKnowledgeBaseSwitch({
      currentKnowledgeBase,
      targetKnowledgeBase: kbId,
      hasMessages: Array.isArray(messages) && messages.length > 0,
      knowledgeBases,
      onCreateNewConversation: async () => {
        await createNewConversation();
      },
      onSwitchKnowledgeBase: setCurrentKnowledgeBase,
    });
  };

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
      const kb = knowledgeBases.find(k => k.id === currentKnowledgeBase);
      const effectiveModelId = kb?.canSelectModel ? selectedModelId : undefined;
      await sendMessage(
        val,
        conversationId,
        currentKnowledgeBase,
        effectiveModelId,
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

  // 新建会话或欢迎模式时，自动将焦点移动到输入框
  useEffect(() => {
    // 对于非真实会话（如 'new' 或默认欢迎态），聚焦输入框
    if (!isValidUUID(curConversation)) {
      // 下一帧触发，确保输入框已渲染
      const t = setTimeout(() => setFocusAtEndSignal((s) => s + 1), 0);
      return () => clearTimeout(t);
    }
  }, [curConversation]);

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
        const kb = knowledgeBases.find(k => k.id === currentKnowledgeBase);
        const effectiveModelId = kb?.canSelectModel ? selectedModelId : undefined;
        await sendMessage(
          userMessage,
          conversationId,
          currentKnowledgeBase,
          effectiveModelId,
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

  // 初始加载模型列表
  useEffect(() => {
    void (async () => {
      try {
        const list = await api.models.getModels();
        setModels(list.map(m => ({ id: m.id, displayName: m.displayName, modelName: m.modelName, isDefault: m.isDefault })));
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.warn('加载模型列表失败', e);
      }
    })();
  }, []);

  // KB 切换时，若允许选择模型而尚未选择，则设默认模型；否则清空
  useEffect(() => {
    const kb = knowledgeBases.find(k => k.id === currentKnowledgeBase);
    if (kb?.canSelectModel) {
      if (!selectedModelId) {
        const def = models.find(m => m.isDefault) || models[0];
        if (def) setSelectedModelId(def.id);
      }
    } else {
      if (selectedModelId) setSelectedModelId(undefined);
    }
  }, [currentKnowledgeBase, knowledgeBases, models]);

  // 持久化模型到会话
  // 模型更新：增加简单去抖，避免频繁PUT
  useEffect(() => {
    const kb = knowledgeBases.find(k => k.id === currentKnowledgeBase);
    if (conversationId && kb?.canSelectModel && selectedModelId) {
      const timer = setTimeout(() => {
        void conversationApi.updateConversation(conversationId, { modelId: selectedModelId }).catch(() => {});
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedModelId, conversationId, currentKnowledgeBase, knowledgeBases]);

  // 快捷操作处理
  const handleQuickAction = async (action: string) => {
    // 每个功能分别指定知识库（可按需扩展/修改）
    const QUICK_ACTION_KB_MAP = QUICK_ACTION_KB_NAME_MAP;

    // 对于需要延迟切换知识库的操作（如requirement-progress），跳过立即切换
    const targetKbName = QUICK_ACTION_KB_MAP[action];
    const shouldSwitchImmediately = action !== 'requirement-progress';
    
    if (targetKbName && shouldSwitchImmediately) {
      const kb = knowledgeBases.find(k => k.name === targetKbName);
      if (kb) {
        if (currentKnowledgeBase !== kb.id) {
          // 使用新的知识库切换逻辑
          await handleKnowledgeBaseSwitch({
            currentKnowledgeBase,
            targetKnowledgeBase: kb.id,
            hasMessages: Array.isArray(messages) && messages.length > 0,
            knowledgeBases,
            onCreateNewConversation: async () => {
              await createNewConversation();
            },
            onSwitchKnowledgeBase: setCurrentKnowledgeBase,
          });
        }
      } else {
        message.warning(`未找到"${targetKbName}"知识库`);
      }
    }

    let quickMessage = '';
    switch (action) {
      case 'open-infofeed':
        navigate('/feeds');
        return;
      case 'readme-query':
        quickMessage = '收费时核对蜡块号，查询参数：收费 接口';
        // 设置后将焦点移动到输入末尾，便于继续输入
        // 由于受控输入，先设值再触发聚焦信号
        setTimeout(() => setFocusAtEndSignal((s) => s + 1), 0);
        break;
      case 'requirement-progress':
        // 打开客户字典选择器（优先切换至目标知识库）
        setIsDictionarySelectorOpen(true);
        return;
      case 'customer-sites':
        // 打开客户站点查询的字典选择器
        setIsCustomerSitesDictOpen(true);
        return;
      case 'suggestion':
        setIsSuggestionModalOpen(true);
        return;
      case 'bug-report':
        setIsBugReportModalOpen(true);
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
    
    // 在发送消息之前，确保切换到正确的知识库
    const targetKbName = KB_NAME_REQUIREMENTS;
    const kb = knowledgeBases.find(k => k.name === targetKbName);
    if (kb && currentKnowledgeBase !== kb.id) {
      await handleKnowledgeBaseSwitch({
        currentKnowledgeBase,
        targetKnowledgeBase: kb.id,
        hasMessages: Array.isArray(messages) && messages.length > 0,
        knowledgeBases,
        onCreateNewConversation: async () => {
          await createNewConversation();
        },
        onSwitchKnowledgeBase: setCurrentKnowledgeBase,
        onComplete: async () => {
          // 知识库切换完成后发送消息
          await handleSubmit(progressMessage);
        }
      });
      return;
    }
    
    // 如果不需要切换知识库，直接发送查询消息
    await handleSubmit(progressMessage);
  };

  // 客户站点查询字典选择处理
  const handleCustomerSitesDictionarySelect = (dictionary: DictionaryItem) => {
    setIsCustomerSitesDictOpen(false);
    
    // 跳转到客户信息页面，默认打开站点菜单
    const params = new URLSearchParams({
      customerName: dictionary.customerName,
      defaultTab: 'sites',
      defaultSubTab: 'summary'
    });
    
    // 使用navigate跳转，参考信息流的跳转方式
    navigate(`/customer?${params.toString()}`);
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

  // 监听知识库变化，自动更新当前会话的知识库ID（增加去抖）
  useEffect(() => {
    // 只有在真实会话（有conversationId）且知识库存在时才更新
    if (conversationId && currentKnowledgeBase) {
      const conversationDetail = conversationDetails[conversationId];
      const currentKbId = conversationDetail?.knowledgeBaseId;
      const needsUpdate = currentKbId !== currentKnowledgeBase;
      if (needsUpdate) {
        const timer = setTimeout(() => {
          void conversationApi
            .updateConversation(conversationId, { knowledgeBaseId: currentKnowledgeBase })
            .then(() => {
              setConversationDetails(prev => ({
                ...prev,
                [conversationId]: {
                  ...prev[conversationId],
                  knowledgeBaseId: currentKnowledgeBase,
                },
              }));
            })
            .catch((error) => {
              console.error('更新会话知识库失败:', error);
              showApiError(error, '保存会话设置失败');
            });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
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
      title = detail?.title?.trim()
        || conversations.find((c) => c.key === curConversation)?.label?.trim()
        || '新对话';
    }
    return title;
  };

  // 欢迎页模式（无有效会话且无消息）：用于让标题/输入区与欢迎背景有自然过渡
  const isWelcomeMode = (!/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i.test(curConversation))
    && (!messages || messages.length === 0);
  // 统一顶部栏后，不再依赖是否为新会话来决定标题栏展示
  

  return (
    <div className="chat-container" style={{ display: 'flex', position: 'relative' }}>
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
        backgroundColor: '#ffffff', // 统一白色背景
      }}>
        {/* 统一标题栏：新对话与常规会话共用 */}
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
            justifyContent: 'space-between', // 改为两端对齐，让按钮始终靠右
            backgroundColor: '#fff',
          }}>
            {/* 左侧：保持空白，确保标题居中 */}
            <div style={{ width: '32px' }} />
            
            {/* 中间：标题 */}
            <span style={{ fontWeight: 500, textAlign: 'center', flex: 1 }}>{renderChatTitle()}</span>
            
            {/* 右侧：功能入口按钮组 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CustomerInfoEntry onClick={() => navigate('/customer')} />
              <InfoFeedEntry onClick={() => navigate('/feeds')} />
            </div>
          </div>
        

        {/* 消息列表 */}
        <ChatMessageList
          messages={messages}
          loading={loading}
          currentKnowledgeBase={currentKnowledgeBase}
          showWelcome={!isValidUUID(curConversation)}
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
          canSelectModel={!!knowledgeBases.find(k => k.id === currentKnowledgeBase)?.canSelectModel}
          models={models.map(m => ({ id: m.id, displayName: m.displayName }))}
          selectedModelId={selectedModelId}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onAttachmentsToggle={() => setAttachmentsOpen(!attachmentsOpen)}
          onFilesChange={setAttachedFiles}
          onKnowledgeBaseChange={handleKnowledgeBaseChange}
          onModelChange={setSelectedModelId}
          onQuickAction={handleQuickAction}
          onCameraCapture={handleCameraCapture}
          glass={isWelcomeMode}
          focusAtEndSignal={focusAtEndSignal}
        />
      </div>
      
      {/* 信息流已迁移为独立页面 /feeds */}

      {/* 客户字典选择器 */}
      <DictionarySelector
        dictionaries={dictionaries}
        isOpen={isDictionarySelectorOpen}
        onSelect={handleDictionarySelect}
        onClose={() => setIsDictionarySelectorOpen(false)}
        title="选择客户"
      />

      {/* 客户站点查询字典选择器 */}
      <DictionarySelector
        dictionaries={dictionaries}
        isOpen={isCustomerSitesDictOpen}
        onSelect={handleCustomerSitesDictionarySelect}
        onClose={() => setIsCustomerSitesDictOpen(false)}
        title="选择客户（查看站点信息）"
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
      
      {/* BUG提交模态框 */}
      <BugReportModal
        open={isBugReportModalOpen}
        onClose={() => setIsBugReportModalOpen(false)}
        onSuccess={() => {
          // BUG提交成功后的处理
          message.success('BUG反馈已提交成功！我们会尽快处理并回复您');
        }}
      />
      
      {/* 信息流已迁移为独立页面 /feeds */}
    </div>
  );
};

export default ChatScreenRefactored;
