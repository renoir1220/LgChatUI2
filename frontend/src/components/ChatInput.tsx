import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Square, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  disabled = false,
  isGenerating = false,
  placeholder = '输入消息...',
  maxLength = 2000,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isGenerating) return;

    onSendMessage(trimmedMessage);
    setMessage('');
    
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    onStopGeneration?.();
  };

  const canSend = message.trim().length > 0 && !disabled && !isGenerating;

  return (
    <div className={cn('border-t border-gray-200 bg-white p-4', className)}>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={cn(
              'relative flex items-end gap-3 rounded-lg border border-gray-300 bg-white p-3 transition-colors',
              isFocused && 'border-blue-500 ring-1 ring-blue-500',
              disabled && 'bg-gray-50 opacity-60'
            )}
          >
            {/* 文本输入区域 */}
            <div className="flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                className="min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
              />
              
              {/* 字符计数 */}
              {message.length > maxLength * 0.8 && (
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {message.length}/{maxLength}
                </div>
              )}
            </div>

            {/* 操作按钮区域 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 附件按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700"
                disabled={disabled || isGenerating}
                onClick={() => {
                  // 这里可以添加附件上传功能
                  console.log('附件上传功能待实现');
                }}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* 发送/停止按钮 */}
              {isGenerating ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="h-8 px-3 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                >
                  <Square className="h-3 w-3 mr-1" />
                  停止
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSend}
                  className={cn(
                    'h-8 px-3',
                    canSend 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="h-3 w-3 mr-1" />
                  发送
                </Button>
              )}
            </div>
          </div>

          {/* 提示文本 */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </form>
      </div>
    </div>
  );
}