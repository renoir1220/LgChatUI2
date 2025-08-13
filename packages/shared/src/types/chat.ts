// Shared types for chatbot message interaction and storage

export enum ChatRole {
  User = 'USER',
  Assistant = 'ASSISTANT',
  System = 'SYSTEM',
}

// Client-friendly role values used by UI libraries/components
export type ClientRole = 'user' | 'assistant' | 'system';

export function toClientRole(role: ChatRole): ClientRole {
  switch (role) {
    case ChatRole.User:
      return 'user';
    case ChatRole.Assistant:
      return 'assistant';
    default:
      return 'system';
  }
}

export function fromClientRole(role: ClientRole): ChatRole {
  switch (role) {
    case 'user':
      return ChatRole.User;
    case 'assistant':
      return ChatRole.Assistant;
    default:
      return ChatRole.System;
  }
}

export interface Citation {
  source: string;
  content: string;
  document_name?: string;
  score?: number;
  dataset_id?: string;
  document_id?: string;
  segment_id?: string;
  position?: number;
}

export interface ChatMessageBase {
  role: ChatRole;
  content: string;
  citations?: Citation[];
  metadata?: Record<string, unknown>;
}

export interface ChatMessage extends ChatMessageBase {
  id: string;
  conversationId: string;
  userId?: string;
  createdAt: string; // ISO timestamp
}

// Request shape for initiating/continuing a chat with the assistant
export interface ChatRequest {
  message: string;
  conversationId?: string;
  knowledgeBaseId?: string;
  userId?: string;
}

// Streaming event shape aligned with Dify-like responses used in LgChatUI
export type ChatStreamEvent = {
  event: 'message' | 'agent_message' | 'message_end' | string;
  answer?: string;
  metadata?: { retriever_resources?: Citation[] } & Record<string, unknown>;
  retriever_resources?: Citation[];
};

