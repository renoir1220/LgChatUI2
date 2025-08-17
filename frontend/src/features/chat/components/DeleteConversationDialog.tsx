import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

interface DeleteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string;
  onConfirm: () => void;
}

/**
 * 删除会话确认对话框组件
 * 使用shadcn/ui的Dialog实现优雅的确认提示
 */
export const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  open,
  onOpenChange,
  conversationTitle,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>删除会话</DialogTitle>
          <DialogDescription>
            确定要删除"{conversationTitle}"吗？此操作不可撤销，会话中的所有消息都将被永久删除。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};