import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/features/shared/utils/utils';
import {
  feedbackService,
  MessageFeedbackType,
  type MessageFeedback,
} from '../services/feedbackService';
import { showApiError } from '../../shared/services/api';

interface MessageFeedbackProps {
  messageId: string;
  className?: string;
}

interface TagOptions {
  helpful: string[];
  notHelpful: string[];
}

/**
 * 消息反馈组件 - 提供快速的 👍 👎 反馈功能 + 轻量标签补充
 */
export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  messageId,
  className = '',
}) => {
  const [currentFeedback, setCurrentFeedback] = useState<MessageFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagPromptType, setTagPromptType] = useState<MessageFeedbackType | null>(null);
  const [tagOptions, setTagOptions] = useState<TagOptions | null>(null);

  const tagCacheRef = useRef<TagOptions>({ helpful: [], notHelpful: [] });
  const promptTimerRef = useRef<number | null>(null);

  // 组件挂载时加载用户已有的反馈
  useEffect(() => {
    loadUserFeedback();
    return () => {
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const loadUserFeedback = async () => {
    try {
      const feedback = await feedbackService.getUserFeedback(messageId);
      setCurrentFeedback(feedback);
      setSelectedTags(feedback?.feedbackTags ?? []);
    } catch (error) {
      // 静默处理错误，不显示错误信息（用户可能没有反馈）
      console.warn('获取用户反馈失败:', error);
      setCurrentFeedback(null);
      setSelectedTags([]);
    }
  };

  const ensureTagOptions = useCallback(async (): Promise<TagOptions> => {
    const cached = tagCacheRef.current;
    if (cached.helpful.length || cached.notHelpful.length) {
      setTagOptions({ ...cached });
      return cached;
    }

    try {
      const data = await feedbackService.getAvailableTags(messageId);
      const normalized: TagOptions = {
        helpful: data?.positiveTags ?? [],
        notHelpful: data?.problemTags ?? [],
      };
      tagCacheRef.current = normalized;
      setTagOptions(normalized);
      return normalized;
    } catch (error) {
      console.warn('获取反馈标签失败:', error);
      return tagCacheRef.current;
    }
  }, [messageId]);

  const openTagPrompt = useCallback(
    async (feedbackType: MessageFeedbackType) => {
      const options = await ensureTagOptions();
      const list =
        feedbackType === MessageFeedbackType.Helpful
          ? options.helpful
          : options.notHelpful;

      if (!list.length) {
        return;
      }

      setTagPromptType(feedbackType);
    },
    [ensureTagOptions],
  );

  useEffect(() => {
    if (!tagPromptType) {
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
        promptTimerRef.current = null;
      }
      return;
    }
    if (promptTimerRef.current) {
      window.clearTimeout(promptTimerRef.current);
    }
    promptTimerRef.current = window.setTimeout(() => {
      setTagPromptType(null);
    }, 4000);
  }, [tagPromptType]);

  const handleFeedback = async (feedbackType: MessageFeedbackType) => {
    if (isSubmitting || isUpdatingTags) return;

    setIsSubmitting(true);
    try {
      // 如果当前已有相同类型的反馈，则删除反馈
      if (currentFeedback?.feedbackType === feedbackType) {
        await feedbackService.deleteFeedback(messageId);
        setCurrentFeedback(null);
        setSelectedTags([]);
        setTagPromptType(null);
      } else {
        // 否则提交新的反馈
        const feedback = await feedbackService.submitQuickFeedback(messageId, {
          feedbackType,
        });
        setCurrentFeedback(feedback);
        setSelectedTags(feedback.feedbackTags ?? []);
        void openTagPrompt(feedbackType);
      }
    } catch (error) {
      showApiError(error, '提交反馈失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = async (tag: string) => {
    if (isUpdatingTags) return;
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];

    setSelectedTags(nextTags);
    setIsUpdatingTags(true);
    try {
      const updated = await feedbackService.updateFeedback(messageId, {
        feedbackTags: nextTags,
      });
      setCurrentFeedback((prev) =>
        prev
          ? {
              ...prev,
              feedbackTags: updated.feedbackTags ?? nextTags,
              updatedAt: updated.updatedAt,
            }
          : prev,
      );
      setTagPromptType(null);
    } catch (error) {
      showApiError(error, '提交反馈失败');
      // 恢复上一状态
      setSelectedTags(currentFeedback?.feedbackTags ?? []);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const isHelpfulActive = currentFeedback?.feedbackType === MessageFeedbackType.Helpful;
  const isNotHelpfulActive =
    currentFeedback?.feedbackType === MessageFeedbackType.NotHelpful;
  const promptTags = tagPromptType
    ? tagPromptType === MessageFeedbackType.Helpful
      ? tagOptions?.helpful ?? []
      : tagOptions?.notHelpful ?? []
    : [];
  const shouldShowPrompt = tagPromptType && promptTags.length > 0;

  return (
    <div className={cn('relative inline-flex items-center gap-1', className)}>
      {/* 有用按钮 */}
      <Button
        variant={isHelpfulActive ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFeedback(MessageFeedbackType.Helpful)}
        disabled={isSubmitting || isUpdatingTags}
        className={cn(
          'h-7 w-7 p-1 transition-colors',
          isHelpfulActive
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'text-gray-500 hover:bg-green-50 hover:text-green-600',
        )}
        title={isHelpfulActive ? '取消有用' : '有用'}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>

      {/* 无用按钮 */}
      <Button
        variant={isNotHelpfulActive ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFeedback(MessageFeedbackType.NotHelpful)}
        disabled={isSubmitting || isUpdatingTags}
        className={cn(
          'h-7 w-7 p-1 transition-colors',
          isNotHelpfulActive
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-gray-500 hover:bg-red-50 hover:text-red-600',
        )}
        title={isNotHelpfulActive ? '取消无用' : '无用'}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>

      {shouldShowPrompt && tagPromptType && (
        <div className="absolute left-1/2 top-full z-10 mt-2 w-[220px] -translate-x-1/2 rounded-lg border bg-background p-3 shadow-md">
          <div className="mb-2 text-xs text-muted-foreground">
            {tagPromptType === MessageFeedbackType.Helpful
              ? '简单标记一下有用的原因？'
              : '标记一下问题类型？'}
          </div>
          <div className="flex flex-wrap gap-2">
            {promptTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Button
                  key={tag}
                  variant={active ? 'secondary' : 'outline'}
                  size="xs"
                  className={cn('rounded-full px-2 py-1 text-xs', active ? 'shadow-sm' : '')}
                  disabled={isUpdatingTags}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">可多选，随时调整</span>
            <Button
              variant="link"
              size="xs"
              className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setTagPromptType(null)}
            >
              稍后再说
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
