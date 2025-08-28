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
import { configService } from '@/features/shared/services/configService';

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
    onRegistered() {
      // 静默处理，避免重复日志
    },
    onRegisterError() {
      // 静默处理，避免重复日志
    },
    onNeedRefresh() {
      setShowDialog(true);
    },
    onOfflineReady() {
      // 静默处理
    },
  });

  // 版本变更自动触发更新：当 config.js 的 VERSION 变化时，主动尝试更新 SW
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const cfg = await configService.getConfig();
        const key = 'APP_CONFIG_VERSION';
        const prev = localStorage.getItem(key);
        if (cfg?.VERSION && cfg.VERSION !== prev) {
          localStorage.setItem(key, cfg.VERSION);
          // 尝试更新 SW（若没有新 SW，则此调用安全无害），避免用户感知
          await updateServiceWorker(true);
        }
      } catch {
        // 静默失败，不影响主流程
      }
      if (canceled) return;
    })();
    return () => { canceled = true; };
  }, [updateServiceWorker]);

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
