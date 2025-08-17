import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 自动消失时间，毫秒
  action?: {
    label: string;
    handler: () => void;
  };
}

// 通知上下文接口
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // 便捷方法
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

// 创建上下文
const NotificationContext = createContext<NotificationContextType | null>(null);

// 通知Provider组件
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // 添加通知
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // 默认5秒
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // 自动移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, newNotification.duration);
    }
    
    return id;
  }, []);
  
  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // 清空所有通知
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // 便捷方法
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);
  
  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration: duration ?? 8000 }); // 错误消息显示更久
  }, [addNotification]);
  
  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);
  
  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);
  
  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// 通知容器组件
function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// 通知项组件
function NotificationItem({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: () => void; 
}) {
  const [isLeaving, setIsLeaving] = useState(false);
  
  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 150); // 等待动画完成
  };
  
  // 自动移除效果
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onRemove, 150); // 等待动画完成
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onRemove]);
  
  // 样式映射
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  return (
    <div
      className={`
        border rounded-lg p-4 shadow-sm transition-all duration-150 transform
        ${typeStyles[notification.type]}
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0">
          {iconMap[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            {notification.title}
          </div>
          {notification.message && (
            <div className="text-xs mt-1 opacity-90">
              {notification.message}
            </div>
          )}
          {notification.action && (
            <button
              onClick={notification.action.handler}
              className="text-xs underline mt-2 hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-xs opacity-60 hover:opacity-100 flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Hook来使用通知系统
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}