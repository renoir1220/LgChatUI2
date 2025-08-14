import { useCallback } from 'react';
import { useChatContext } from '@/contexts/ChatContext';

// 消息操作Hook
export function useMessageActions() {
  const { state, actions } = useChatContext();
  
  // 复制消息内容
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 可以添加成功提示
      console.log('消息已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      actions.setError('复制失败');
    }
  }, [actions]);
  
  // 重新生成消息
  const regenerateMessage = useCallback(async (messageId: string) => {
    const message = state.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;
    
    // 找到上一条用户消息
    const messageIndex = state.messages.findIndex(m => m.id === messageId);
    const userMessage = state.messages
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.role === 'user');
    
    if (!userMessage) return;
    
    try {
      actions.setStreaming(true);
      
      // 删除当前助手消息
      actions.dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
      
      // 重新发送用户消息触发生成
      await actions.sendMessage(userMessage.content);
      
    } catch (error) {
      console.error('重新生成失败:', error);
      actions.setError('重新生成失败');
      actions.setStreaming(false);
    }
  }, [state.messages, actions]);
  
  // 点赞消息
  const likeMessage = useCallback(async (messageId: string) => {
    try {
      // 更新消息的点赞状态（需要在消息类型中添加liked字段）
      actions.updateMessage(messageId, { 
        // liked: true  // 这需要在类型定义中添加
      });
      
      // 可以发送到后端记录用户反馈
      console.log('消息已点赞:', messageId);
      
    } catch (error) {
      console.error('点赞失败:', error);
      actions.setError('操作失败');
    }
  }, [actions]);
  
  // 点踩消息
  const dislikeMessage = useCallback(async (messageId: string) => {
    try {
      // 更新消息的点踩状态
      actions.updateMessage(messageId, { 
        // disliked: true  // 这需要在类型定义中添加
      });
      
      // 可以发送到后端记录用户反馈
      console.log('消息已点踩:', messageId);
      
    } catch (error) {
      console.error('点踩失败:', error);
      actions.setError('操作失败');
    }
  }, [actions]);
  
  // 停止生成
  const stopGeneration = useCallback(() => {
    actions.setStreaming(false);
    // 这里应该取消正在进行的API请求
    console.log('已停止生成');
  }, [actions]);
  
  return {
    copyMessage,
    regenerateMessage,
    likeMessage,
    dislikeMessage,
    stopGeneration,
  };
}

// 会话操作Hook
export function useConversationActions() {
  const { actions } = useChatContext();
  
  // 新建会话
  const newConversation = useCallback(() => {
    actions.createConversation();
  }, [actions]);
  
  // 重命名会话
  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      actions.updateConversation(conversationId, { 
        title: newTitle.trim(),
        updated_at: new Date().toISOString(),
      });
      
      console.log('会话已重命名:', newTitle);
      
    } catch (error) {
      console.error('重命名失败:', error);
      actions.setError('重命名失败');
    }
  }, [actions]);
  
  // 删除会话
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      actions.deleteConversation(conversationId);
      console.log('会话已删除:', conversationId);
      
    } catch (error) {
      console.error('删除失败:', error);
      actions.setError('删除失败');
    }
  }, [actions]);
  
  return {
    newConversation,
    renameConversation,
    deleteConversation,
  };
}