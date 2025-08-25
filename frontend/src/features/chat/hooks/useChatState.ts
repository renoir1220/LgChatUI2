import { useState, useRef } from 'react';
import type { UploadFile } from 'antd';
import type { Citation, ChatRole, ClientRole } from "@types";
import { toClientRole } from "@types";

// 重新导出共享类型以便组件使用
export type { Citation, ChatRole, ClientRole };
export { toClientRole };

export interface ConversationItem {
  key: string;
  label: string;
  group: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface BubbleDataType {
  role: ClientRole;
  content: string;
  citations?: Citation[];
  image?: string; // 图片数据的Base64编码或URL
}

export interface StreamResponse {
  event: 'agent_message' | 'message';
  answer?: string;
  metadata?: {
    retriever_resources?: Array<{
      document_name?: string;
      dataset_name?: string;
      content: string;
      score: number;
      dataset_id: string;
      document_id: string;
      segment_id: string;
      position: number;
    }>;
  };
}

// 默认数据
const DEFAULT_CONVERSATIONS_ITEMS: ConversationItem[] = [
  {
    key: 'default-0',
    label: '欢迎使用 ChatUI',
    group: '今天',
  },
];

/**
 * 聊天状态管理Hook
 * 管理所有与聊天相关的状态和逻辑
 */
export function useChatState(initialCurConversation?: string) {
  // 状态管理
  const [messageHistory, setMessageHistory] = useState<Record<string, BubbleDataType[]>>({});
  const [conversations, setConversations] = useState<ConversationItem[]>(DEFAULT_CONVERSATIONS_ITEMS);
  const [conversationDetails, setConversationDetails] = useState<Record<string, ConversationDetail>>({});
  // 启动：若有初始会话ID（来自路由），直接使用；否则为“new”
  const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
  const initialCur = initialCurConversation && isValidUUID(initialCurConversation)
    ? initialCurConversation
    : 'new';
  const [curConversation, setCurConversation] = useState<string>(initialCur);
  const [conversationId, setConversationId] = useState<string | undefined>(
    isValidUUID(initialCur) ? initialCur : undefined
  );
  const [messages, setMessages] = useState<BubbleDataType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI状态
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Refs
  const abortController = useRef<AbortController | null>(null);

  return {
    // 会话相关状态
    messageHistory,
    setMessageHistory,
    conversations,
    setConversations,
    conversationDetails,
    setConversationDetails,
    curConversation,
    setCurConversation,
    conversationId,
    setConversationId,
    
    // 消息相关状态
    messages,
    setMessages,
    loading,
    setLoading,
    
    // UI状态
    attachmentsOpen,
    setAttachmentsOpen,
    attachedFiles,
    setAttachedFiles,
    inputValue,
    setInputValue,
    
    // Refs
    abortController,
    
    // 默认数据
    DEFAULT_CONVERSATIONS_ITEMS,
  };
}
