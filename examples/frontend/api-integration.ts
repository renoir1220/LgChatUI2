/**
 * 前端 API 集成示例
 * 展示 HTTP 客户端、SSE 处理、错误处理的最佳实践
 */

// ✅ API 客户端配置
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  // 获取认证token
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // 构建请求头
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers = { ...this.defaultHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return { ...headers, ...customHeaders };
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.buildHeaders(options.headers as Record<string, string>)
    };

    try {
      const response = await fetch(url, config);
      
      // 处理认证失败
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('认证失败，请重新登录');
      }

      // 处理其他HTTP错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // 处理空响应
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as any;
    } catch (error) {
      console.error(`API请求失败: ${url}`, error);
      throw error;
    }
  }

  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return this.request<T>(url.pathname + url.search);
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }

  // 流式请求（SSE）
  async postStream(
    endpoint: string,
    data: any,
    onMessage: (data: any) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              onMessage(parsed);
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('流请求失败'));
    }
  }
}

// ✅ API 服务实例
export const api = new ApiClient();

// ✅ 会话相关 API
export const conversationsAPI = {
  // 获取会话列表
  async list(page: number = 1, pageSize: number = 20): Promise<Conversation[]> {
    return api.get<Conversation[]>('/conversations', {
      page: page.toString(),
      pageSize: pageSize.toString()
    });
  },

  // 创建新会话
  async create(data: CreateConversationRequest): Promise<Conversation> {
    return api.post<Conversation>('/conversations', data);
  },

  // 更新会话
  async update(id: string, data: UpdateConversationRequest): Promise<Conversation> {
    return api.put<Conversation>(`/conversations/${id}`, data);
  },

  // 删除会话
  async delete(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/conversations/${id}`);
  },

  // 获取会话消息
  async getMessages(
    id: string, 
    page: number = 1, 
    pageSize: number = 50
  ): Promise<ChatMessage[]> {
    return api.get<ChatMessage[]>(`/conversations/${id}/messages`, {
      page: page.toString(),
      pageSize: pageSize.toString()
    });
  }
};

// ✅ 聊天相关 API
export const chatAPI = {
  // 发送消息（流式）
  async sendMessage(
    request: ChatRequest,
    onMessage: (content: string) => void,
    onError: (error: Error) => void,
    onComplete: (result: { messageId: string; conversationId: string }) => void
  ): Promise<void> {
    let accumulatedContent = '';
    let conversationId = request.conversationId;

    await api.postStream(
      '/chat',
      request,
      (data) => {
        if (data.event === 'message') {
          accumulatedContent += data.answer || '';
          onMessage(accumulatedContent);
        } else if (data.event === 'message_end') {
          // 从响应头获取会话ID
          conversationId = data.conversationId || conversationId;
        }
      },
      onError,
      () => {
        onComplete({
          messageId: `msg_${Date.now()}`,
          conversationId: conversationId || 'unknown'
        });
      }
    );
  }
};

// ✅ 认证相关 API
export const authAPI = {
  // 登录
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
    }
    
    return response;
  },

  // 登出
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    // 可以调用服务端登出接口
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // 忽略登出错误
      console.warn('登出请求失败:', error);
    }
  },

  // 验证token
  async validateToken(): Promise<boolean> {
    try {
      await api.get('/auth/validate');
      return true;
    } catch (error) {
      return false;
    }
  }
};

// ✅ TTS 相关 API
export const ttsAPI = {
  // 语音合成
  async synthesize(text: string, voice?: string): Promise<Blob> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...api['buildHeaders']()
      },
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
      throw new Error('语音合成失败');
    }

    return await response.blob();
  }
};

// ✅ 知识库相关 API
export const knowledgeBaseAPI = {
  // 获取知识库列表
  async list(): Promise<KnowledgeBase[]> {
    return api.get<KnowledgeBase[]>('/knowledge-bases');
  }
};

// ✅ 错误处理工具
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ✅ 请求重试工具
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries) {
        throw lastError;
      }

      // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
}

// ✅ 使用示例：带重试的API调用
export const robustAPI = {
  async getConversations(): Promise<Conversation[]> {
    return withRetry(() => conversationsAPI.list(), 3, 1000);
  },

  async sendMessageWithRetry(
    request: ChatRequest,
    onMessage: (content: string) => void,
    onError: (error: Error) => void,
    onComplete: (result: { messageId: string; conversationId: string }) => void
  ): Promise<void> {
    return withRetry(
      () => chatAPI.sendMessage(request, onMessage, onError, onComplete),
      2, // 流式请求重试次数较少
      2000
    );
  }
};

// ✅ 缓存工具
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ✅ 带缓存的 API
const conversationCache = new SimpleCache<Conversation[]>(300); // 5分钟缓存

export const cachedAPI = {
  async getConversations(useCache: boolean = true): Promise<Conversation[]> {
    const cacheKey = 'conversations';
    
    if (useCache) {
      const cached = conversationCache.get(cacheKey);
      if (cached) return cached;
    }

    const conversations = await conversationsAPI.list();
    conversationCache.set(cacheKey, conversations);
    return conversations;
  },

  invalidateConversationCache(): void {
    conversationCache.clear();
  }
};

// ✅ React Hook 集成示例
import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('API call failed'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, retry };
}