import { useState, useEffect } from 'react';
import { adminConversationApi } from '../../../services/adminConversationApi';
import type { ConversationInfo, MessageDisplay } from '../../../services/adminConversationApi';

export const useConversationDetail = (conversationId: string | null) => {
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setError(null);
      return;
    }

    const fetchConversationDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminConversationApi.getConversationMessages(conversationId);

        if (response.success) {
          setConversation(response.data.conversation);
          setMessages(response.data.messages);
        } else {
          throw new Error('获取会话详情失败');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '加载失败');
        console.error('Failed to fetch conversation detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetail();
  }, [conversationId]);

  return {
    conversation,
    messages,
    loading,
    error,
  };
};