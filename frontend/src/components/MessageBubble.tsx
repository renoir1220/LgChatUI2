import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, Citation } from '@lg/shared';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  className?: string;
}

export function MessageBubble({
  message,
  isStreaming = false,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  className,
}: MessageBubbleProps) {
  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  return (
    <div
      className={cn(
        'flex gap-3 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* 头像 */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              U
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" />
            <AvatarFallback className="bg-purple-500 text-white text-sm">
              AI
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* 消息内容 */}
      <div className={cn('flex-1 max-w-[80%]', isUser && 'text-right')}>
        {/* 角色标识 */}
        <div className={cn('text-sm text-gray-500 mb-1', isUser && 'text-right')}>
          <span className="font-medium">
            {isUser ? '你' : 'AI助手'}
          </span>
          <span className="ml-2 text-xs">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {/* 消息气泡 */}
        <Card
          className={cn(
            'relative',
            isUser
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white border-gray-200',
          )}
        >
          <CardContent className="p-3">
            <div
              className={cn(
                'whitespace-pre-wrap break-words',
                isUser ? 'text-white' : 'text-gray-900',
              )}
            >
              {message.content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </div>

            {/* 引用信息 */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">引用来源：</div>
                <div className="flex flex-wrap gap-1">
                  {message.citations.map((citation, index) => (
                    <CitationBadge
                      key={index}
                      citation={citation}
                      position={index + 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {isAssistant && !isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
              onClick={onCopy}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
              onClick={onRegenerate}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-green-600"
              onClick={onLike}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-red-600"
              onClick={onDislike}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// 引用标签组件
function CitationBadge({ citation, position }: { citation: Citation; position: number }) {
  return (
    <Badge
      variant="outline"
      className="text-xs cursor-pointer hover:bg-gray-50"
      onClick={() => {
        // 这里可以触发引用详情弹窗
        console.log('Citation clicked:', citation);
      }}
    >
      {position}. {citation.document_name || citation.source}
    </Badge>
  );
}