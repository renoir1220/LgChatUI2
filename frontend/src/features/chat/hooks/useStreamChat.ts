import { useRef } from 'react';
import { apiFetch } from '../../shared/services/api';
import { saveCitationsToCache, saveAssistantCitationsToCache } from '../utils/messageCache';
import type { BubbleDataType, StreamResponse } from './useChatState';

/**
 * 流式聊天处理Hook
 * 处理与聊天API的交互和流式响应
 */
export function useStreamChat() {
  const abortController = useRef<AbortController | null>(null);

  const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);

  /**
   * 发送聊天消息并处理流式响应
   */
  const sendMessage = async (
    message: string,
    conversationId: string | undefined,
    currentKnowledgeBase: string | undefined,
    messages: BubbleDataType[],
    setMessages: React.Dispatch<React.SetStateAction<BubbleDataType[]>>,
    onConversationUpdate?: (newConversationId: string) => void
  ): Promise<void> => {
    // 中止之前的请求
    abortController.current?.abort();
    abortController.current = new AbortController();

    const baseBody = { message, knowledgeBaseId: currentKnowledgeBase };
    const sentConvId = isValidUUID(conversationId) ? conversationId : undefined;
    const makeBody = (withConv: boolean) => JSON.stringify(
      withConv && sentConvId ? { ...baseBody, conversationId: sentConvId } : baseBody
    );

    const userMessage = { role: 'user', content: message };
    const botMessageIndex = messages.length + 1;
    const assistantOrdinal = messages.filter((m) => m.role === 'assistant').length + 1;
    
    // 添加用户消息和空的助手消息
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', citations: [] }]);

    try {
      let response = await apiFetch(`/api/chat`, {
        method: 'POST',
        body: makeBody(true),
        signal: abortController.current.signal,
      });

      // 若因非法/无权限会话导致 404，自动重试不带会话ID（创建新会话）
      if (!response.ok && response.status === 404 && sentConvId) {
        response = await apiFetch(`/api/chat`, {
          method: 'POST',
          body: makeBody(false),
          signal: abortController.current.signal,
        });
      }

      // 读取并保存会话ID
      const respConvId = response.headers.get('X-Conversation-ID') || undefined;
      if (respConvId && respConvId !== conversationId) {
        onConversationUpdate?.(respConvId);
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      // 处理流式响应
      await processStreamResponse(
        response.body,
        botMessageIndex,
        assistantOrdinal,
        respConvId,
        setMessages
      );

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('请求失败:', error);
        const errorMessage = {
          role: 'assistant',
          content: `请求失败: ${error.message}`,
          citations: []
        };
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[botMessageIndex]) {
            newMessages[botMessageIndex] = errorMessage;
          } else {
            newMessages.push(errorMessage);
          }
          return newMessages;
        });
      }
    }
  };

  /**
   * 处理流式响应
   */
  const processStreamResponse = async (
    responseBody: ReadableStream<Uint8Array>,
    botMessageIndex: number,
    assistantOrdinal: number,
    conversationId: string | undefined,
    setMessages: React.Dispatch<React.SetStateAction<BubbleDataType[]>>
  ): Promise<void> => {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.substring(6);
          if (rawData.includes('[DONE]')) {
            return;
          }
          
          try {
            const jsonData = JSON.parse(rawData) as StreamResponse;
            
            // 处理文本增量
            if (jsonData.event === 'agent_message' || jsonData.event === 'message') {
              setMessages(prev => prev.map((msg, index) => {
                if (index === botMessageIndex && msg.role === 'assistant') {
                  return { ...msg, content: msg.content + (jsonData.answer || '') };
                }
                return msg;
              }));
            }

            // 处理知识库引用数据
            const retrieverResources = jsonData?.metadata?.retriever_resources;
            if (retrieverResources && Array.isArray(retrieverResources) && retrieverResources.length > 0) {
              const withCitations = retrieverResources.map((r) => ({
                source: r.document_name || r.dataset_name || '未知来源',
                content: r.content,
                document_name: r.document_name || '',
                score: r.score,
                dataset_id: r.dataset_id,
                document_id: r.document_id,
                segment_id: r.segment_id,
                position: r.position,
              }));

              setMessages(prev => prev.map((msg, index) => {
                if (index === botMessageIndex && msg.role === 'assistant') {
                  // 保存引用信息到缓存
                  if (conversationId) {
                    saveAssistantCitationsToCache(conversationId, assistantOrdinal, withCitations);
                    saveCitationsToCache(conversationId, botMessageIndex, withCitations);
                  }

                  return {
                    ...msg,
                    citations: withCitations,
                  };
                }
                return msg;
              }));
            }
          } catch (e) {
            console.error('流式数据JSON解析失败:', e);
          }
        }
      }
    }
  };

  /**
   * 中止当前请求
   */
  const abortRequest = () => {
    abortController.current?.abort();
  };

  return {
    sendMessage,
    abortRequest,
  };
}