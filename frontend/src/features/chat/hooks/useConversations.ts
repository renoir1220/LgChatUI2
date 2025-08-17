import { useEffect } from 'react';
import { apiGet } from '../../shared/services/api';
import { getCitationsFromCache, cleanupExpiredCache } from '../utils/messageCache';
import type { ConversationItem, ConversationDetail, MessageRecord, BubbleDataType, Citation } from './useChatState';

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
  setCurrentKnowledgeBase: (id: string) => void
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
          
          // 如果首个会话有知识库ID，自动设置
          if (list[0].knowledgeBaseId) {
            setCurrentKnowledgeBase(list[0].knowledgeBaseId);
          }
          
          // 加载首个会话消息
          await loadConversationMessages(list[0].id);
        }
      }
    } catch (error) {
      console.error('初始化加载失败:', error);
    }
  };

  /**
   * 初始化：加载会话列表并选择第一个会话
   */
  const initializeConversations = async () => {
    await loadConversations(true); // 传入 true 表示要选择第一个会话
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
        const role = m.role === 'USER' ? 'user' : 'assistant';
        let citations: Citation[] = [];
        
        if (role === 'assistant') {
          assistantCount += 1;
          const byAssistantKey = cachedCitations[`a:${assistantCount}`] || [];
          const byLegacyIndex = cachedCitations[index.toString()] || [];
          citations = (byAssistantKey.length ? byAssistantKey : byLegacyIndex) as Citation[];
        }
        
        return {
          role,
          content: m.content,
          citations
        };
      });
      
      setMessages(mapped);
    } catch (error) {
      console.error('加载会话消息失败:', error);
      setMessages([]);
    }
  };

  /**
   * 切换到指定会话
   */
  const switchConversation = async (conversationKey: string) => {
    setCurConversation(conversationKey);
    setConversationId(typeof conversationKey === 'string' ? conversationKey : undefined);
    
    if (conversationKey && conversationKey !== 'new') {
      // 从会话详细信息中获取知识库ID并自动设置
      const conversationDetail = conversationDetails[conversationKey];
      if (conversationDetail && conversationDetail.knowledgeBaseId) {
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

  // 初始化时加载会话
  useEffect(() => {
    initializeConversations();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return {
    loadConversations,
    initializeConversations,
    loadConversationMessages,
    switchConversation,
    createNewConversation,
    refreshConversations,
  };
}