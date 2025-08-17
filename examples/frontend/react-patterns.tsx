/**
 * 前端 React + TypeScript 编码模式示例
 * 展示组件设计、状态管理、Hook使用的最佳实践
 */

import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ✅ 正确：明确的Props接口
interface ChatMessageProps {
  message: ChatMessage;
  onCopy?: (content: string) => void;
  onSpeak?: (content: string) => void;
  className?: string;
}

// ✅ 正确：使用React.memo优化性能
export const ChatMessage = React.memo<ChatMessageProps>(({ 
  message, 
  onCopy, 
  onSpeak,
  className 
}) => {
  const isUser = message.role === 'user';
  
  const handleCopy = useCallback(() => {
    onCopy?.(message.content);
  }, [message.content, onCopy]);

  const handleSpeak = useCallback(() => {
    onSpeak?.(message.content);
  }, [message.content, onSpeak]);

  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start",
      className
    )}>
      <div className={cn(
        "max-w-[80%] p-3 rounded-lg",
        isUser 
          ? "bg-blue-500 text-white" 
          : "bg-gray-100 text-gray-900"
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            复制
          </Button>
          {!isUser && (
            <Button size="sm" variant="ghost" onClick={handleSpeak}>
              朗读
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => 
  // 自定义比较函数优化重渲染
  prevProps.message.id === nextProps.message.id &&
  prevProps.message.content === nextProps.message.content
);

// ✅ 正确：自定义Hook模式
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载会话失败';
      setError(errorMessage);
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title: string, knowledgeBaseId?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, knowledgeBaseId })
      });
      
      if (!response.ok) {
        throw new Error('创建会话失败');
      }
      
      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建会话失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除会话失败');
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除会话失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return { 
    conversations, 
    loading, 
    error,
    reload: loadConversations,
    create: createConversation,
    delete: deleteConversation
  };
};

// ✅ 正确：Context + useReducer 状态管理
interface ChatState {
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

type ChatAction = 
  | { type: 'SET_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload,
        messages: [],
        error: null
      };
      
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
      
    case 'UPDATE_STREAMING_MESSAGE':
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const updatedMessages = [...state.messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: action.payload
        };
        return { ...state, messages: updatedMessages };
      }
      return state;
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
      
    default:
      return state;
  }
};

// ✅ 正确：Context Provider 组件
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, {
    currentConversation: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentConversation) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: state.currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 创建助手消息占位符
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        conversationId: state.currentConversation.id,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

      // 发送流式请求
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: state.currentConversation.id
        })
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      // 处理SSE流
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              dispatch({ type: 'SET_LOADING', payload: false });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.event === 'message') {
                accumulatedContent += parsed.answer;
                dispatch({ 
                  type: 'UPDATE_STREAMING_MESSAGE', 
                  payload: accumulatedContent 
                });
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentConversation]);

  const contextValue = {
    state,
    actions: {
      setConversation: (conversation: Conversation) =>
        dispatch({ type: 'SET_CONVERSATION', payload: conversation }),
      sendMessage,
      clearMessages: () => dispatch({ type: 'CLEAR_MESSAGES' }),
      setError: (error: string | null) => 
        dispatch({ type: 'SET_ERROR', payload: error })
    }
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// ✅ 正确：forwardRef 使用示例
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <Input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

// ✅ 正确：事件处理器类型安全
interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    try {
      await onSubmit({ username: username.trim(), password });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
    }
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
    if (error) setError(null); // 清除错误状态
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (error) setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CustomInput
        label="用户名"
        type="text"
        value={username}
        onChange={handleUsernameChange}
        error={error}
        disabled={loading}
        placeholder="请输入用户名"
      />
      
      <CustomInput
        label="密码"
        type="password"
        value={password}
        onChange={handlePasswordChange}
        disabled={loading}
        placeholder="请输入密码"
      />
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '登录中...' : '登录'}
      </Button>
      
      {error && (
        <div className="text-sm text-red-500 text-center">
          {error}
        </div>
      )}
    </form>
  );
};

// ✅ 正确：条件渲染类型安全
interface UserProfileProps {
  user?: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  if (!user) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-muted-foreground">未登录</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{user.displayName}</h3>
      <p className="text-sm text-muted-foreground">@{user.username}</p>
      {user.roles && user.roles.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">角色：</p>
          <div className="flex gap-1 mt-1">
            {user.roles.map((role, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-secondary rounded"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};