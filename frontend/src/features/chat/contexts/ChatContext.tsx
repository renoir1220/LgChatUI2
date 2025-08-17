import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/chatService';
import { ChatRole } from '@lg/shared';
import type { 
  ChatMessage, 
  Conversation, 
  KnowledgeBase,
  ChatRequest
} from '@lg/shared';

// 聊天状态接口
interface ChatState {
  // 会话相关
  conversations: Conversation[];
  currentConversation: Conversation | null;
  
  // 消息相关
  messages: ChatMessage[];
  streamingContent: string; // 当前流式输入的内容
  
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
  | { type: 'SET_STREAMING_CONTENT'; payload: string }
  | { type: 'APPEND_STREAMING_CONTENT'; payload: string }
  | { type: 'CLEAR_STREAMING_CONTENT' }
  
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
  streamingContent: '',
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
    
    case 'SET_STREAMING_CONTENT':
      return { ...state, streamingContent: action.payload };
    
    case 'APPEND_STREAMING_CONTENT':
      return { ...state, streamingContent: state.streamingContent + action.payload };
    
    case 'CLEAR_STREAMING_CONTENT':
      return { ...state, streamingContent: '' };
    
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 便捷操作方法
  const actions = {
    // 会话操作
    loadConversations: useCallback(async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const conversations = await api.conversation.getConversations();
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
      } catch (error) {
        console.error('加载会话列表失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载会话列表失败' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),
    
    selectConversation: useCallback(async (conversation: Conversation) => {
      try {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const messages = await api.message.getMessages(conversation.id);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      } catch (error) {
        console.error('加载会话消息失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载会话消息失败' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),
    
    createConversation: useCallback(async (title?: string) => {
      try {
        const request = { title: title || '新对话' };
        const conversation = await api.conversation.createConversation(request);
        dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
        dispatch({ type: 'SET_MESSAGES', payload: [] }); // 清空消息
        return conversation;
      } catch (error) {
        console.error('创建会话失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '创建会话失败' });
        return null;
      }
    }, []),
    
    updateConversation: useCallback(async (id: string, updates: Partial<Conversation>) => {
      try {
        if (updates.title) {
          const conversation = await api.conversation.renameConversation(id, updates.title);
          dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates: conversation } });
        } else {
          dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates } });
        }
      } catch (error) {
        console.error('更新会话失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '更新会话失败' });
      }
    }, []),
    
    deleteConversation: useCallback(async (id: string) => {
      try {
        await api.conversation.deleteConversation(id);
        dispatch({ type: 'DELETE_CONVERSATION', payload: id });
      } catch (error) {
        console.error('删除会话失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '删除会话失败' });
      }
    }, []),
    
    // 消息操作
    loadMessages: useCallback(async (conversationId: string) => {
      try {
        const messages = await api.conversation.getMessages(conversationId);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      } catch (error) {
        console.error('加载消息失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载消息失败' });
      }
    }, []),
    
    addMessage: useCallback((message: ChatMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    }, []),
    
    updateMessage: useCallback((id: string, updates: Partial<ChatMessage>) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
    }, []),
    
    sendMessage: useCallback(async (content: string) => {
      // sendMessage 开始
      if (!content.trim() || state.isStreaming) return;
      
      try {
        let conversationId = state.currentConversation?.id;
        
        // 如果没有当前会话，先创建新会话
        if (!conversationId) {
          const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          const request = { title };
          const newConversation = await api.conversation.createConversation(request);
          dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
          dispatch({ type: 'SET_MESSAGES', payload: [] });
          conversationId = newConversation.id;
        }
        
        // 创建用户消息
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          conversationId: conversationId,
          role: ChatRole.User,
          content,
          createdAt: new Date().toISOString(),
        };
        
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_STREAMING', payload: true });
        dispatch({ type: 'CLEAR_STREAMING_CONTENT' });
        
        // 准备聊天请求
        // 选中的知识库ID
        const chatRequest: ChatRequest = {
          conversationId: conversationId,
          message: content,
          knowledgeBaseId: state.selectedKnowledgeBase,
        };
        // 构建聊天请求
        
        // 创建临时助手消息用于流式显示
        const tempAssistantMessageId = (Date.now() + 1).toString();
        const tempAssistantMessage: ChatMessage = {
          id: tempAssistantMessageId,
          conversationId: conversationId,
          role: ChatRole.Assistant,
          content: '',
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: tempAssistantMessage });
        
        // 发送流式聊天请求
        // 调用sendMessage API
        const controller = await api.chat.sendMessage(
          chatRequest,
          // onChunk: 处理流式内容
          (chunk: string) => {
            // 收到chunk
            dispatch({ type: 'APPEND_STREAMING_CONTENT', payload: chunk });
            // 实时更新临时消息
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: tempAssistantMessageId, 
                updates: { content: state.streamingContent + chunk } 
              }
            });
          },
          // onComplete: 处理完成的消息
          (completeMessage: ChatMessage) => {
            // 收到完整消息
            // 用完整消息替换临时消息
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: tempAssistantMessageId, 
                updates: completeMessage 
              }
            });
            dispatch({ type: 'CLEAR_STREAMING_CONTENT' });
            dispatch({ type: 'SET_STREAMING', payload: false });
          },
          // onError: 处理错误
          (error: Error) => {
            console.error('聊天请求失败:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            dispatch({ type: 'SET_STREAMING', payload: false });
            dispatch({ type: 'CLEAR_STREAMING_CONTENT' });
            // 删除临时消息
            dispatch({ type: 'DELETE_MESSAGE', payload: tempAssistantMessageId });
          }
        );
        
        // 保存控制器引用，用于取消请求
        abortControllerRef.current = controller;
        
      } catch (error) {
        console.error('发送消息失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '发送消息失败' });
        dispatch({ type: 'SET_STREAMING', payload: false });
      }
    }, [state.currentConversation, state.isStreaming, state.selectedKnowledgeBase, state.streamingContent]),
    
    addMessage: useCallback((message: ChatMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    }, []),
    
    updateMessage: useCallback((id: string, updates: Partial<ChatMessage>) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
    }, []),
    
    // 知识库操作
    loadKnowledgeBases: useCallback(async () => {
      try {
        const knowledgeBases = await api.knowledgeBase.getKnowledgeBases();
        dispatch({ type: 'SET_KNOWLEDGE_BASES', payload: knowledgeBases });
      } catch (error) {
        console.error('加载知识库失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载知识库失败' });
      }
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
    
    // 停止生成
    stopGeneration: useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      dispatch({ type: 'SET_STREAMING', payload: false });
      dispatch({ type: 'CLEAR_STREAMING_CONTENT' });
    }, []),
  };
  
  // 初始化加载
  useEffect(() => {
    // 异步加载数据
    const initializeData = async () => {
      try {
        const [conversations, knowledgeBases] = await Promise.all([
          api.conversation.getConversations(),
          api.knowledgeBase.getKnowledgeBases(),
        ]);
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
        dispatch({ type: 'SET_KNOWLEDGE_BASES', payload: knowledgeBases });
      } catch (error) {
        console.error('初始化数据失败:', error);
        dispatch({ type: 'SET_ERROR', payload: '加载数据失败' });
      }
    };
    
    initializeData();
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
