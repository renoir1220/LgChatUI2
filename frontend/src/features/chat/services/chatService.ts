import { apiGet, apiPost, API_BASE } from '../../shared/services/api';
import { getToken } from '../../auth/utils/auth';
import type { 
  Conversation, 
  ChatMessage, 
  KnowledgeBase, 
  ChatRequest
} from '@lg/shared';
import type { CreateConversationRequest } from '../../shared/types/api';

// 会话相关API
export const conversationApi = {
  // 获取会话列表
  getConversations: async (): Promise<Conversation[]> => {
    return apiGet<Conversation[]>('/api/conversations');
  },

  // 创建新会话
  createConversation: async (request: CreateConversationRequest): Promise<Conversation> => {
    return apiPost<Conversation>('/api/conversations', request);
  },

  // 获取会话详情
  getConversation: async (id: string): Promise<Conversation> => {
    return apiGet<Conversation>(`/api/conversations/${id}`);
  },

  // 删除会话
  deleteConversation: async (id: string): Promise<void> => {
    await apiPost(`/api/conversations/${id}`, {});
  },

  // 重命名会话
  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    return apiPost<Conversation>(`/api/conversations/${id}/rename`, { title });
  },
};

// 消息相关API
export const messageApi = {
  // 获取会话消息
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    return apiGet<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
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
    // 消息交互：开始发送
    
    const abortController = new AbortController();
    
    try {
      const token = getToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // 添加认证头
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 发送请求到聊天接口

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: abortController.signal,
      });
      
      // 收到响应

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应流为空');
      }

      // 开始读取流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completeMessage: ChatMessage | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          // 读取流块
          
          if (done) {
            // 流式响应读取完成
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          // 处理SSE数据

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            // 处理SSE行
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              // SSE数据
              
              if (data === '[DONE]') {
                // 收到流式传输完成标志
                // 流式传输完成
                if (completeMessage && onComplete) {
                  // 调用onComplete回调
                  onComplete(completeMessage);
                }
                return abortController;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'message') {
                  // 收到message类型数据
                  // 完整消息信息（用于存储）
                  completeMessage = parsed.message;
                } else if (parsed.type === 'chunk') {
                  // 收到chunk类型数据
                  // 流式内容块
                  if (onChunk) {
                    onChunk(parsed.content);
                  }
                } else if (parsed.type === 'error') {
                  // 收到error类型数据
                  // 错误信息
                  throw new Error(parsed.error);
                } else {
                  // 未知的SSE事件类型
                }
              } catch (parseError) {
                console.error('解析SSE数据失败:', parseError);
              }
            } else if (line.startsWith('event: ')) {
              // 收到SSE事件
            }
          }
        }
      } finally {
        // 释放流读取器
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 聊天请求被中止
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
    return apiGet<KnowledgeBase[]>('/api/knowledge-bases');
  },

  // 获取知识库详情
  getKnowledgeBase: async (id: string): Promise<KnowledgeBase> => {
    return apiGet<KnowledgeBase>(`/api/knowledge-bases/${id}`);
  },
};

// 导出所有API
export const api = {
  conversation: conversationApi,
  message: messageApi,
  chat: chatApi,
  knowledgeBase: knowledgeBaseApi,
};
