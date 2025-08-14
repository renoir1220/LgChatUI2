import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { 
  ChatMessage, 
  Conversation, 
  KnowledgeBase 
} from '@lg/shared';

// 聊天状态接口
interface ChatState {
  // 会话相关
  conversations: Conversation[];
  currentConversation: Conversation | null;
  
  // 消息相关
  messages: ChatMessage[];
  
  // 知识库相关
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBase?: string;
  
  // UI状态
  sidebarOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  
  // 错误状态
  error: string | null;
}

// 动作类型
type ChatAction = 
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  
  | { type: 'SET_KNOWLEDGE_BASES'; payload: KnowledgeBase[] }
  | { type: 'SELECT_KNOWLEDGE_BASE'; payload: string | undefined }
  
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// 初始状态
const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  knowledgeBases: [],
  selectedKnowledgeBase: undefined,
  sidebarOpen: true,
  isLoading: false,
  isStreaming: false,
  error: null,
};

// Reducer函数
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations],
        currentConversation: action.payload 
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id 
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
        currentConversation: state.currentConversation?.id === action.payload.id
          ? { ...state.currentConversation, ...action.payload.updates }
          : state.currentConversation
      };
    
    case 'DELETE_CONVERSATION': {
      const filteredConversations = state.conversations.filter(conv => conv.id !== action.payload);
      return {
        ...state,
        conversations: filteredConversations,
        currentConversation: state.currentConversation?.id === action.payload 
          ? (filteredConversations[0] || null)
          : state.currentConversation,
        messages: state.currentConversation?.id === action.payload ? [] : state.messages
      };
    }
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload] 
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    
    case 'SET_KNOWLEDGE_BASES':
      return { ...state, knowledgeBases: action.payload };
    
    case 'SELECT_KNOWLEDGE_BASE':
      return { ...state, selectedKnowledgeBase: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// 上下文接口
interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  
  // 便捷操作方法
  actions: {
    // 会话操作
    loadConversations: () => void;
    selectConversation: (conversation: Conversation) => void;
    createConversation: (title?: string) => void;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;
    deleteConversation: (id: string) => void;
    
    // 消息操作
    loadMessages: (conversationId: string) => void;
    sendMessage: (content: string) => void;
    addMessage: (message: ChatMessage) => void;
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    
    // 知识库操作
    loadKnowledgeBases: () => void;
    selectKnowledgeBase: (id?: string) => void;
    
    // UI操作
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setLoading: (loading: boolean) => void;
    setStreaming: (streaming: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

// 创建上下文
const ChatContext = createContext<ChatContextType | null>(null);

// 上下文Provider组件
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // 便捷操作方法
  const actions = {
    // 会话操作
    loadConversations: useCallback(() => {
      // 模拟加载会话列表（后续替换为真实API调用）
      const mockConversations: Conversation[] = [
        {
          id: '1',
          title: '关于React开发的讨论',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
          message_count: 5,
        },
        {
          id: '2', 
          title: 'TypeScript最佳实践',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: 'user-1',
          message_count: 3,
        },
      ];
      dispatch({ type: 'SET_CONVERSATIONS', payload: mockConversations });
    }, []),
    
    selectConversation: useCallback((conversation: Conversation) => {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      // 直接调用loadMessages而不是通过actions
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // 模拟加载消息（后续替换为真实API调用）
      setTimeout(() => {
        const mockMessages: ChatMessage[] = [
          {
            id: '1',
            conversation_id: conversation.id,
            role: 'user',
            content: '你好，请介绍一下React的核心概念。',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            conversation_id: conversation.id,
            role: 'assistant',
            content: 'React是一个用于构建用户界面的JavaScript库，主要有以下核心概念：\n\n1. **组件（Components）**：React应用由组件构成\n2. **JSX**：JavaScript的语法扩展\n3. **Props**：组件间的数据传递\n4. **State**：组件内部状态管理\n5. **生命周期**：组件的创建、更新、销毁过程',
            created_at: new Date(Date.now() - 3500000).toISOString(),
            citations: [
              {
                source: 'React官方文档',
                content: 'React是一个用于构建用户界面的JavaScript库...',
                document_name: 'React文档',
                score: 0.92,
                dataset_id: 'kb-1',
                document_id: 'react-doc-1',
                segment_id: 'intro-1',
                position: 1,
              },
            ],
          },
        ];
        dispatch({ type: 'SET_MESSAGES', payload: mockMessages });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 500);
    }, []),
    
    createConversation: useCallback((title?: string) => {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: title || '新对话',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
        message_count: 0,
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
      dispatch({ type: 'SET_MESSAGES', payload: [] }); // 清空消息
    }, []),
    
    updateConversation: useCallback((id: string, updates: Partial<Conversation>) => {
      dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates } });
    }, []),
    
    deleteConversation: useCallback((id: string) => {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
    }, []),
    
    // 消息操作
    loadMessages: useCallback((conversationId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // 模拟加载消息（后续替换为真实API调用）
      setTimeout(() => {
        const mockMessages: ChatMessage[] = [
          {
            id: '1',
            conversation_id: conversationId,
            role: 'user',
            content: '你好，请介绍一下React的核心概念。',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            conversation_id: conversationId,
            role: 'assistant',
            content: 'React是一个用于构建用户界面的JavaScript库，主要有以下核心概念：\n\n1. **组件（Components）**：React应用由组件构成\n2. **JSX**：JavaScript的语法扩展\n3. **Props**：组件间的数据传递\n4. **State**：组件内部状态管理\n5. **生命周期**：组件的创建、更新、销毁过程',
            created_at: new Date(Date.now() - 3500000).toISOString(),
            citations: [
              {
                source: 'React官方文档',
                content: 'React是一个用于构建用户界面的JavaScript库...',
                document_name: 'React文档',
                score: 0.92,
                dataset_id: 'kb-1',
                document_id: 'react-doc-1',
                segment_id: 'intro-1',
                position: 1,
              },
            ],
          },
        ];
        dispatch({ type: 'SET_MESSAGES', payload: mockMessages });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 500);
    }, []),
    
    sendMessage: useCallback(async (content: string) => {
      if (!content.trim() || state.isStreaming) return;
      
      // 创建用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        conversation_id: state.currentConversation?.id || 'new',
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_STREAMING', payload: true });
      
      // 如果没有当前会话，创建新会话
      if (!state.currentConversation) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
          message_count: 1,
        };
        dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
      }
      
      try {
        // 模拟AI回复（后续替换为真实API调用）
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversation_id: state.currentConversation?.id || 'new',
            role: 'assistant',
            content: '这是一个模拟的AI回复。实际实现中，这里会调用真实的聊天API。',
            created_at: new Date().toISOString(),
            citations: state.selectedKnowledgeBase ? [
              {
                source: '示例文档.pdf',
                content: '这是一个示例引用内容，展示知识库的引用功能。',
                document_name: '示例文档',
                score: 0.85,
                dataset_id: state.selectedKnowledgeBase,
                document_id: 'doc-1',
                segment_id: 'seg-1',
                position: 1,
              },
            ] : undefined,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
          dispatch({ type: 'SET_STREAMING', payload: false });
        }, 2000);
      } catch (error) {
        console.error('发送消息失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '发送消息失败' });
        dispatch({ type: 'SET_STREAMING', payload: false });
      }
    }, [state.currentConversation, state.isStreaming, state.selectedKnowledgeBase]),
    
    addMessage: useCallback((message: ChatMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    }, []),
    
    updateMessage: useCallback((id: string, updates: Partial<ChatMessage>) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
    }, []),
    
    // 知识库操作
    loadKnowledgeBases: useCallback(() => {
      // 模拟加载知识库（后续替换为真实API调用）
      const mockKnowledgeBases: KnowledgeBase[] = [
        {
          id: 'kb-1',
          name: '技术文档',
          description: '包含各种技术文档和API参考',
          enabled: true,
        },
        {
          id: 'kb-2',
          name: '项目手册',
          description: '项目相关的规范和指南',
          enabled: true,
        },
        {
          id: 'kb-3',
          name: '历史归档',
          description: '已归档的旧文档',
          enabled: false,
        },
      ];
      dispatch({ type: 'SET_KNOWLEDGE_BASES', payload: mockKnowledgeBases });
    }, []),
    
    selectKnowledgeBase: useCallback((id?: string) => {
      dispatch({ type: 'SELECT_KNOWLEDGE_BASE', payload: id });
    }, []),
    
    // UI操作
    toggleSidebar: useCallback(() => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []),
    
    setSidebarOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
    }, []),
    
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),
    
    setStreaming: useCallback((streaming: boolean) => {
      dispatch({ type: 'SET_STREAMING', payload: streaming });
    }, []),
    
    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),
    
    clearError: useCallback(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    }, []),
  };
  
  // 初始化加载
  useEffect(() => {
    // 加载会话列表
    const mockConversations: Conversation[] = [
      {
        id: '1',
        title: '关于React开发的讨论',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-1',
        message_count: 5,
      },
      {
        id: '2', 
        title: 'TypeScript最佳实践',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: 'user-1',
        message_count: 3,
      },
    ];
    dispatch({ type: 'SET_CONVERSATIONS', payload: mockConversations });

    // 加载知识库
    const mockKnowledgeBases: KnowledgeBase[] = [
      {
        id: 'kb-1',
        name: '技术文档',
        description: '包含各种技术文档和API参考',
        enabled: true,
      },
      {
        id: 'kb-2',
        name: '项目手册',
        description: '项目相关的规范和指南',
        enabled: true,
      },
      {
        id: 'kb-3',
        name: '历史归档',
        description: '已归档的旧文档',
        enabled: false,
      },
    ];
    dispatch({ type: 'SET_KNOWLEDGE_BASES', payload: mockKnowledgeBases });
  }, []);
  
  const contextValue: ChatContextType = {
    state,
    dispatch,
    actions,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook来使用聊天上下文
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}