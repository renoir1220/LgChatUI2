import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { feedbackService, MessageFeedbackType, type MessageFeedback as MessageFeedbackData } from '../services/feedbackService';
import { showApiError } from '../../shared/services/api';

interface MessageFeedbackProps {
  messageId: string;
  className?: string;
}

/**
 * 消息反馈组件 - 提供快速的 👍 👎 反馈功能
 */
export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  messageId,
  className = ''
}) => {
  const [currentFeedback, setCurrentFeedback] = useState<MessageFeedbackData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 组件挂载时加载用户已有的反馈
  useEffect(() => {
    loadUserFeedback();
  }, [messageId]);

  const loadUserFeedback = async () => {
    try {
      const feedback = await feedbackService.getUserFeedback(messageId);
      setCurrentFeedback(feedback);
    } catch (error) {
      // 静默处理错误，不显示错误信息（用户可能没有反馈）
      console.warn('获取用户反馈失败:', error);
    }
  };

  const handleFeedback = async (feedbackType: MessageFeedbackType) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 如果当前已有相同类型的反馈，则删除反馈
      if (currentFeedback?.feedbackType === feedbackType) {
        await feedbackService.deleteFeedback(messageId);
        setCurrentFeedback(null);
      } else {
        // 否则提交新的反馈
        const feedback = await feedbackService.submitQuickFeedback(messageId, {
          feedbackType
        });
        setCurrentFeedback(feedback);
      }
    } catch (error) {
      showApiError(error, '提交反馈失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHelpfulActive = currentFeedback?.feedbackType === MessageFeedbackType.Helpful;
  const isNotHelpfulActive = currentFeedback?.feedbackType === MessageFeedbackType.NotHelpful;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 有用按钮 */}
      <Button
        variant={isHelpfulActive ? "default" : "ghost"}
        size="sm"
        onClick={() => handleFeedback(MessageFeedbackType.Helpful)}
        disabled={isSubmitting}
        className={`p-1 h-7 w-7 ${
          isHelpfulActive
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
        }`}
        title={isHelpfulActive ? "取消有用" : "有用"}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>

      {/* 无用按钮 */}
      <Button
        variant={isNotHelpfulActive ? "default" : "ghost"}
        size="sm"
        onClick={() => handleFeedback(MessageFeedbackType.NotHelpful)}
        disabled={isSubmitting}
        className={`p-1 h-7 w-7 ${
          isNotHelpfulActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
        }`}
        title={isNotHelpfulActive ? "取消无用" : "无用"}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  );
};