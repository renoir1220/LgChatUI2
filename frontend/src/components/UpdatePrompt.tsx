import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RefreshCw, Download } from 'lucide-react';

/**
 * PWA更新提示组件
 * 检测到新版本时显示更新对话框，让用户选择是否立即更新
 */
export const UpdatePrompt: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW注册成功:', r);
    },
    onRegisterError(error: any) {
      console.error('SW注册失败:', error);
      // 在开发环境下，SSL证书错误时提供友好提示和解决方案
      if (process.env.NODE_ENV === 'development') {
        console.warn('开发环境下忽略SW注册失败，可能是SSL证书问题');
        
        // 如果是SSL证书错误，提供用户友好的解决指导
        if (error.message && error.message.includes('SSL certificate error')) {
          console.warn('解决方案:');
          console.warn('1. 请手动访问 https://172.20.10.3:5173/dev-sw.js?dev-sw 并信任证书');
          console.warn('2. 或者在终端运行: sudo mkcert -install');
          console.warn('3. 然后刷新页面');
          
          // 可以选择在3秒后自动重试注册
          setTimeout(() => {
            console.log('自动重试SW注册...');
            window.location.reload();
          }, 5000);
        }
      }
    },
    onNeedRefresh() {
      // 检测到新版本时显示更新对话框
      setShowDialog(true);
    },
    onOfflineReady() {
      console.log('应用已准备好离线使用');
    },
  });

  // 当需要刷新时显示对话框
  useEffect(() => {
    if (needRefresh) {
      setShowDialog(true);
    }
  }, [needRefresh]);

  // 处理立即更新
  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setShowDialog(false);
      setNeedRefresh(false);
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 处理稍后更新
  const handleLater = () => {
    setShowDialog(false);
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            发现新版本
          </DialogTitle>
          <DialogDescription>
            朗珈GPT有新版本可用。更新后您可以体验最新的功能和性能改进。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>更新将会刷新页面</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleLater}
            className="flex-1"
          >
            稍后更新
          </Button>
          <Button
            onClick={handleUpdate}
            className="flex-1"
          >
            立即更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePrompt;