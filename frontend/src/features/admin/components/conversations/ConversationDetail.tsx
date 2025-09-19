import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
// 临时使用原生Date方法替代date-fns
import { useConversationDetail } from './hooks/useConversationDetail';
import type { MessageDisplay } from '../../services/adminConversationApi';

interface ConversationDetailProps {
  conversationId: string | null;
}

const MessageBubble: React.FC<{ message: MessageDisplay }> = ({ message }) => {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] space-y-2`}>
        <div
          className={`p-3 rounded-lg ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* 消息时间和反馈 */}
        <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>

          {/* 显示用户反馈（仅AI消息） */}
          {!isUser && message.userFeedback && (
            <div className="flex items-center gap-1">
              <Separator orientation="vertical" className="h-3" />
              {message.userFeedback.feedbackType === 'helpful' ? (
                <div className="flex items-center gap-1 text-green-600">
                  <ThumbsUp className="h-3 w-3" />
                  <span>有用</span>
                </div>
              ) : message.userFeedback.feedbackType === 'not_helpful' ? (
                <div className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="h-3 w-3" />
                  <span>无用</span>
                </div>
              ) : null}

              {message.userFeedback.comment && (
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  "{message.userFeedback.comment}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-blue-100">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
}) => {
  const { conversation, messages, loading, error } = useConversationDetail(conversationId);

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>选择左侧会话查看详情</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full p-6">
        <div className="space-y-4">
          {/* 头部骨架 */}
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
          <Separator />
          {/* 消息骨架 */}
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[70%] space-y-2">
                  <div className="h-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{error || '会话不存在'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 会话信息头部 */}
      <div className="p-4 border-b">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{conversation.title}</h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{conversation.username}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(conversation.createdAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{conversation.messageCount}条消息</span>
            </div>

            {conversation.knowledgeBaseName && (
              <Badge variant="outline">
                {conversation.knowledgeBaseName}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              该会话暂无消息记录
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationDetail;