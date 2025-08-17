/**
 * 前端样式系统示例
 * 展示 TailwindCSS + CSS模块化的使用模式
 */

import React from 'react';
import { cn } from '@/lib/utils';
import styles from './ImageThumb.css';

// ✅ TailwindCSS 类名组合示例
export const ChatBubble: React.FC<{ message: ChatMessage; isUser: boolean }> = ({ 
  message, 
  isUser 
}) => {
  const bubbleClasses = cn(
    // 基础样式
    "max-w-[80%] p-3 rounded-lg shadow-sm",
    // 条件样式
    isUser 
      ? "bg-blue-500 text-white ml-auto" 
      : "bg-gray-100 text-gray-900 mr-auto",
    // 响应式样式
    "md:max-w-[70%] lg:max-w-[60%]"
  );

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={bubbleClasses}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// ✅ 响应式布局示例
export const ChatLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="
      flex flex-col lg:flex-row
      h-screen w-full
      bg-background
    ">
      {/* 侧边栏 */}
      <aside className="
        w-full lg:w-80 
        border-r border-border
        lg:block hidden
        overflow-y-auto
      ">
        <ConversationList />
      </aside>

      {/* 主要内容区 */}
      <main className="
        flex-1 
        flex flex-col
        min-h-0
      ">
        {children}
      </main>

      {/* 移动端侧边栏 */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>
    </div>
  );
};

// ✅ 动画效果示例
export const MessageLoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm text-muted-foreground">AI正在思考...</span>
    </div>
  );
};

// ✅ CSS模块化使用示例（用于复杂动画）
export const ImageThumbnail: React.FC<{ 
  src: string; 
  alt: string; 
  onClick?: () => void;
}> = ({ src, alt, onClick }) => {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div className={cn(
      styles.thumbnail,
      loaded && styles.loaded,
      onClick && styles.clickable,
      "relative overflow-hidden rounded-lg"
    )}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        onLoad={() => setLoaded(true)}
        onClick={onClick}
      />
      
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// ✅ 主题变量使用示例
export const ThemeShowcase: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      {/* 颜色系统 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-primary text-primary-foreground rounded">
          Primary
        </div>
        <div className="p-4 bg-secondary text-secondary-foreground rounded">
          Secondary
        </div>
        <div className="p-4 bg-accent text-accent-foreground rounded">
          Accent
        </div>
        <div className="p-4 bg-muted text-muted-foreground rounded">
          Muted
        </div>
      </div>

      {/* 边框和阴影 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-lg">
          Border
        </div>
        <div className="p-4 shadow-sm bg-card rounded-lg">
          Shadow SM
        </div>
        <div className="p-4 shadow-lg bg-card rounded-lg">
          Shadow LG
        </div>
      </div>

      {/* 文字层级 */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
        <h2 className="text-3xl font-semibold text-foreground">Heading 2</h2>
        <h3 className="text-2xl font-medium text-foreground">Heading 3</h3>
        <p className="text-base text-foreground">Body text</p>
        <p className="text-sm text-muted-foreground">Small text</p>
        <p className="text-xs text-muted-foreground">Extra small text</p>
      </div>
    </div>
  );
};

// ✅ 状态指示器样式示例
export const StatusIndicator: React.FC<{
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className={cn(
      "rounded-full border-2 border-white shadow-sm",
      sizeClasses[size],
      statusClasses[status],
      status === 'online' && 'animate-pulse'
    )} />
  );
};

// ✅ 加载状态组件
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn(
      "border-2 border-muted border-t-primary rounded-full animate-spin",
      sizeClasses[size],
      className
    )} />
  );
};

// ✅ 骨架屏组件
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-3 p-4 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ✅ 错误状态组件
export const ErrorBoundaryFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-destructive/20 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-6 h-6 text-destructive" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h2 className="text-lg font-semibold text-foreground mb-2">
          出现了一些问题
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || '应用遇到了意外错误'}
        </p>
        
        <button
          onClick={resetError}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
};

// ✅ 空状态组件
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      
      {action}
    </div>
  );
};