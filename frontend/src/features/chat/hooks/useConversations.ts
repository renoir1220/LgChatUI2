import { useEffect } from 'react';
import { apiGet, showApiError } from '../../shared/services/api';
import { getCitationsFromCache, cleanupExpiredCache } from '../utils/messageCache';
import type { ConversationItem, ConversationDetail, MessageRecord, BubbleDataType, Citation } from './useChatState';
import { isValidUUID } from '../../shared/utils/uuid';

// 使用统一的 UUID 校验工具

/**
 * 会话管理Hook
 * 处理会话列表的加载、切换和历史消息恢复
 */
export function useConversations(
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>,
  conversationDetails: Record<string, ConversationDetail>,
  setConversationDetails: React.Dispatch<React.SetStateAction<Record<string, ConversationDetail>>>,
  setCurConversation: React.Dispatch<React.SetStateAction<string>>,
  setConversationId: React.Dispatch<React.SetStateAction<string | undefined>>,
  setMessages: React.Dispatch<React.SetStateAction<BubbleDataType[]>>,
  setCurrentKnowledgeBase: (id: string) => void,
  currentKnowledgeBase?: string
) {
  
  /**
   * 加载会话列表（不自动切换会话）
   */
  const loadConversations = async (shouldSelectFirst = false) => {
    try {
      cleanupExpiredCache();
      
      const list = await apiGet<ConversationDetail[]>(`/api/conversations`);
      if (Array.isArray(list) && list.length > 0) {
        setConversations(list.map((c) => ({ key: c.id, label: c.title, group: '最近' })));
        
        // 存储会话详细信息
        const details: Record<string, ConversationDetail> = {};
        list.forEach(c => {
          details[c.id] = c;
        });
        setConversationDetails(details);
        
        // 只有在明确指定时才自动选择第一个会话（比如初始化时）
        if (shouldSelectFirst) {
          setCurConversation(list[0].id);
          setConversationId(list[0].id);
          
          // 如果首个会话有知识库ID且与当前不同，才自动设置
          if (list[0].knowledgeBaseId && list[0].knowledgeBaseId !== currentKnowledgeBase) {
            setCurrentKnowledgeBase(list[0].knowledgeBaseId);
          }
          
          // 加载首个会话消息
          await loadConversationMessages(list[0].id);
        }
      }
    } catch (error) {
      console.error('初始化加载失败:', error);
      showApiError(error, '加载会话列表失败');
    }
  };

  /**
   * 初始化：仅加载会话列表，不自动切换到第一条历史
   */
  const initializeConversations = async () => {
    await loadConversations(false); // 初始化时不自动选择第一会话
  };

  /**
   * 加载指定会话的消息历史
   */
  const loadConversationMessages = async (conversationId: string) => {
    try {
      const msgs = await apiGet<MessageRecord[]>(`/api/conversations/${conversationId}`);
      const cachedCitations = getCitationsFromCache(conversationId);
      let assistantCount = 0;
      
      const mapped = msgs.map((m, index) => {
        const role = m.role === 'USER' ? 'user' as const : 'assistant' as const;
        let citations: Citation[] = [];
        
        if (role === 'assistant') {
          assistantCount += 1;
          const byAssistantKey = cachedCitations[`a:${assistantCount}`] || [];
          const byLegacyIndex = cachedCitations[index.toString()] || [];
          citations = (byAssistantKey.length ? byAssistantKey : byLegacyIndex) as Citation[];
        }
        
        return {
          id: m.id, // 保留消息ID用于反馈功能
          role,
          content: m.content,
          citations
        };
      });
      
      setMessages(mapped);
    } catch (error) {
      console.error('加载会话消息失败:', error);
      setMessages([]);
      showApiError(error, '加载会话消息失败');
    }
  };

  /**
   * 切换到指定会话
   */
  const switchConversation = async (conversationKey: string) => {
    setCurConversation(conversationKey);
    // 只有当conversationKey是有效的UUID时（即真实会话），才设置conversationId
    // 虚拟会话（如'default-0', 'new'）应该保持conversationId为undefined
    setConversationId(isValidUUID(conversationKey) ? conversationKey : undefined);
    // 立即清空当前消息，给予用户即时反馈（由外层控制 loading 展示等待态）
    setMessages([]);
    
    if (conversationKey && conversationKey !== 'new') {
      // 从会话详细信息中获取知识库ID，只在不同时才设置
      const conversationDetail = conversationDetails[conversationKey];
      if (conversationDetail && conversationDetail.knowledgeBaseId &&
          conversationDetail.knowledgeBaseId !== currentKnowledgeBase) {
        setCurrentKnowledgeBase(conversationDetail.knowledgeBaseId);
      }
      
      await loadConversationMessages(conversationKey);
    } else {
      setMessages([]);
    }
  };

  /**
   * 创建新会话
   */
  const createNewConversation = () => {
    setConversationId(undefined);
    setCurConversation('new');
    setMessages([]);
  };

  /**
   * 刷新会话列表（不切换当前会话）
   */
  const refreshConversations = async () => {
    await loadConversations(false); // 传入 false 表示不要选择第一个会话
  };

  // 移除自动初始化，改为外部控制初始化时机
  // useEffect(() => {
  //   initializeConversations();
  // }, []); // 空依赖数组，只在组件挂载时执行一次

  return {
    loadConversations,
    initializeConversations,
    loadConversationMessages,
    switchConversation,
    createNewConversation,
    refreshConversations,
  };
}
