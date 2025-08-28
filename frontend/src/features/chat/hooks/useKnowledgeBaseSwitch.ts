import React, { useCallback } from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export interface KnowledgeBaseSwitchOptions {
  currentKnowledgeBase: string | undefined;
  targetKnowledgeBase: string;
  hasMessages: boolean;
  knowledgeBases: Array<{ id: string; name: string }>;
  onCreateNewConversation: () => Promise<void>;
  onSwitchKnowledgeBase: (kbId: string) => void;
  onComplete?: () => Promise<void>; // 切换完成后的回调
}

/**
 * 知识库切换逻辑 Hook
 * 处理切换知识库时的确认逻辑：
 * - 如果当前没有消息，直接切换
 * - 如果已有消息，弹出确认对话框，询问是否创建新对话
 */
export const useKnowledgeBaseSwitch = () => {
  const handleKnowledgeBaseSwitch = useCallback(
    async (options: KnowledgeBaseSwitchOptions) => {
      const {
        currentKnowledgeBase,
        targetKnowledgeBase,
        hasMessages,
        knowledgeBases,
        onCreateNewConversation,
        onSwitchKnowledgeBase,
        onComplete,
      } = options;

      // 如果目标知识库与当前相同，不执行任何操作
      if (currentKnowledgeBase === targetKnowledgeBase) {
        return;
      }

      const targetKb = knowledgeBases.find(kb => kb.id === targetKnowledgeBase);
      const currentKb = knowledgeBases.find(kb => kb.id === currentKnowledgeBase);
      
      if (!targetKb) {
        message.error('未找到目标知识库');
        return;
      }

      // 如果当前对话没有消息，直接切换
      if (!hasMessages) {
        onSwitchKnowledgeBase(targetKnowledgeBase);
        if (onComplete) {
          await onComplete();
        }
        return;
      }

      // 如果已有消息，弹出确认对话框
      Modal.confirm({
        title: '切换知识库',
        icon: React.createElement(ExclamationCircleOutlined),
        content: '切换知识库需要开启新对话，是否继续？',
        okText: '继续',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 先切换知识库
            onSwitchKnowledgeBase(targetKnowledgeBase);
            // 再创建新对话
            await onCreateNewConversation();
            message.success('已切换知识库并创建新对话');
            // 执行完成回调
            if (onComplete) {
              await onComplete();
            }
          } catch (error) {
            console.error('创建新对话失败:', error);
            message.error('创建新对话失败，请重试');
          }
        },
      });
    },
    []
  );

  return { handleKnowledgeBaseSwitch };
};