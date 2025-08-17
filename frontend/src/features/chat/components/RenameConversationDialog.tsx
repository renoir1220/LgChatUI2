import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface RenameConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string;
  onConfirm: (newTitle: string) => void;
}

/**
 * 重命名会话对话框组件
 * 使用shadcn/ui的Dialog实现输入新名称的界面
 */
export const RenameConversationDialog: React.FC<RenameConversationDialogProps> = ({
  open,
  onOpenChange,
  conversationTitle,
  onConfirm,
}) => {
  const [newTitle, setNewTitle] = useState(conversationTitle);
  const [isLoading, setIsLoading] = useState(false);

  // 当对话框打开时，重置输入框内容为当前标题
  useEffect(() => {
    if (open) {
      setNewTitle(conversationTitle);
    }
  }, [open, conversationTitle]);

  const handleConfirm = async () => {
    if (!newTitle.trim()) {
      return; // 不允许空标题
    }

    if (newTitle.trim() === conversationTitle) {
      onOpenChange(false); // 如果没有变化，直接关闭
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(newTitle.trim());
      onOpenChange(false);
    } catch (error) {
      console.error('重命名失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewTitle(conversationTitle); // 重置为原标题
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>重命名会话</DialogTitle>
          <DialogDescription>
            输入新的会话名称
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="会话名称"
            className="w-full"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading || !newTitle.trim()}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};