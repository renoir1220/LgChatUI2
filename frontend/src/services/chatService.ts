import { apiGet, apiPost, API_BASE } from '@/lib/api';
import { getToken } from '@/utils/auth';
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
    return apiGet<Conversation[]>('/api/conversations');
  },

  // 创建新会话
  createConversation: async (request: ConversationCreateRequest): Promise<Conversation> => {
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
    console.log('=== 前端开始发送聊天消息 ===');
    console.log('请求参数:', JSON.stringify(request, null, 2));
    console.log('API_BASE:', API_BASE);
    
    const abortController = new AbortController();
    
    try {
      const token = getToken();
      console.log('获取到的token:', token ? '已获取' : '未获取');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // 添加认证头
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('请求头:', headers);
      console.log('发送请求到:', `${API_BASE}/api/chat`);

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: abortController.signal,
      });
      
      console.log('收到响应:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应流为空');
      }

      console.log('开始读取流式响应...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completeMessage: ChatMessage | null = null;
      let chunkCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          chunkCount++;
          console.log(`读取流块 #${chunkCount}, done:`, done, 'value size:', value?.length);
          
          if (done) {
            console.log('流式响应读取完成');
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          console.log(`处理 ${lines.length} 行SSE数据`);

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            console.log('处理SSE行:', line);
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              console.log('SSE数据:', data);
              
              if (data === '[DONE]') {
                console.log('收到流式传输完成标志');
                // 流式传输完成
                if (completeMessage && onComplete) {
                  console.log('调用onComplete回调');
                  onComplete(completeMessage);
                }
                return abortController;
              }

              try {
                const parsed = JSON.parse(data);
                console.log('解析的SSE数据:', parsed);
                
                if (parsed.type === 'message') {
                  console.log('收到message类型数据');
                  // 完整消息信息（用于存储）
                  completeMessage = parsed.message;
                } else if (parsed.type === 'chunk') {
                  console.log('收到chunk类型数据');
                  // 流式内容块
                  if (onChunk) {
                    onChunk(parsed.content);
                  }
                } else if (parsed.type === 'error') {
                  console.log('收到error类型数据');
                  // 错误信息
                  throw new Error(parsed.error);
                } else {
                  console.log('未知的SSE事件类型:', parsed.type || 'no type');
                }
              } catch (parseError) {
                console.error('解析SSE数据失败:', parseError, '原始数据:', data);
              }
            } else if (line.startsWith('event: ')) {
              const eventType = line.slice(7);
              console.log('收到SSE事件:', eventType);
            }
          }
        }
      } finally {
        console.log('释放流读取器');
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('聊天请求被中止');
      } else {
        console.error('=== 前端聊天请求失败 ===');
        console.error('错误详情:', error);
        if (onError) {
          console.log('调用onError回调');
          onError(error as Error);
        }
      }
    }

    console.log('=== 前端聊天消息发送完成 ===');
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