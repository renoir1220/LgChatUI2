import { apiGet, apiPost, API_BASE } from '@/lib/api';
import type { 
  Conversation, 
  ChatMessage, 
  KnowledgeBase, 
  ChatRequest,
  ConversationCreateRequest 
} from '@lg/shared';

// 会话相关API
export const conversationApi = {
  // 获取会话列表
  getConversations: async (): Promise<Conversation[]> => {
    return apiGet<Conversation[]>('/api/chat-history/conversations');
  },

  // 创建新会话
  createConversation: async (request: ConversationCreateRequest): Promise<Conversation> => {
    return apiPost<Conversation>('/api/chat-history/conversations', request);
  },

  // 获取会话详情
  getConversation: async (id: string): Promise<Conversation> => {
    return apiGet<Conversation>(`/api/chat-history/conversations/${id}`);
  },

  // 删除会话
  deleteConversation: async (id: string): Promise<void> => {
    await apiPost(`/api/chat-history/conversations/${id}`, {});
  },

  // 重命名会话
  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    return apiPost<Conversation>(`/api/chat-history/conversations/${id}/rename`, { title });
  },
};

// 消息相关API
export const messageApi = {
  // 获取会话消息
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    return apiGet<ChatMessage[]>(`/api/chat-history/conversations/${conversationId}/messages`);
  },
};

// 聊天相关API
export const chatApi = {
  // 发送聊天消息（流式）
  sendMessage: async (
    request: ChatRequest,
    onChunk?: (chunk: string) => void,
    onComplete?: (message: ChatMessage) => void,
    onError?: (error: Error) => void
  ): Promise<AbortController> => {
    const abortController = new AbortController();
    
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应流为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completeMessage: ChatMessage | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // 流式传输完成
                if (completeMessage && onComplete) {
                  onComplete(completeMessage);
                }
                return abortController;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'message') {
                  // 完整消息信息（用于存储）
                  completeMessage = parsed.message;
                } else if (parsed.type === 'chunk') {
                  // 流式内容块
                  if (onChunk) {
                    onChunk(parsed.content);
                  }
                } else if (parsed.type === 'error') {
                  // 错误信息
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                console.error('解析SSE数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('聊天请求被中止');
      } else {
        console.error('聊天请求失败:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }

    return abortController;
  },
};

// 知识库相关API
export const knowledgeBaseApi = {
  // 获取知识库列表
  getKnowledgeBases: async (): Promise<KnowledgeBase[]> => {
    return apiGet<KnowledgeBase[]>('/api/knowledge-base');
  },

  // 获取知识库详情
  getKnowledgeBase: async (id: string): Promise<KnowledgeBase> => {
    return apiGet<KnowledgeBase>(`/api/knowledge-base/${id}`);
  },
};

// 导出所有API
export const api = {
  conversation: conversationApi,
  message: messageApi,
  chat: chatApi,
  knowledgeBase: knowledgeBaseApi,
};