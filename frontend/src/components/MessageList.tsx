import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@lg/shared';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingContent = '',
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  className,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, streamingContent]);

  const handleCopy = (content: string) => {
    onCopy?.(content);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center p-8',
        className
      )}>
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">暂无对话</div>
          <div className="text-sm">开始一段新的对话吧</div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className={cn('flex-1 px-4 py-2', className)}
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && index === messages.length - 1}
            onCopy={() => handleCopy(message.content)}
            onRegenerate={() => onRegenerate?.(message.id)}
            onLike={() => onLike?.(message.id)}
            onDislike={() => onDislike?.(message.id)}
          />
        ))}

        {/* 加载指示器 */}
        {isLoading && !isStreaming && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              AI
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">AI助手正在思考...</div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}