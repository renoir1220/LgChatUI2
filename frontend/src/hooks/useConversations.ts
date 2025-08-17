import { useEffect } from 'react';
import { apiGet } from '../lib/api';
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
   * 加载会话列表和首个会话的消息
   */
  const loadConversations = async () => {
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
        
        setCurConversation(list[0].id);
        setConversationId(list[0].id);
        
        // 如果首个会话有知识库ID，自动设置
        if (list[0].knowledgeBaseId) {
          setCurrentKnowledgeBase(list[0].knowledgeBaseId);
        }
        
        // 加载首个会话消息
        await loadConversationMessages(list[0].id);
      }
    } catch (error) {
      console.error('初始化加载失败:', error);
    }
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
   * 刷新会话列表
   */
  const refreshConversations = async () => {
    try {
      const list = await apiGet<ConversationDetail[]>(`/api/conversations`);
      setConversations(list.map((c) => ({ key: c.id, label: c.title, group: '最近' })));
      
      const details: Record<string, ConversationDetail> = {};
      list.forEach(c => {
        details[c.id] = c;
      });
      setConversationDetails(details);
    } catch (error) {
      console.error('刷新会话列表失败:', error);
    }
  };

  // 初始化时加载会话
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    loadConversations,
    loadConversationMessages,
    switchConversation,
    createNewConversation,
    refreshConversations,
  };
}