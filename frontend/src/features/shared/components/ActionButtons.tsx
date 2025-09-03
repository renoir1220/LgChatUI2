/**
 * 动作按钮组件
 * 用于渲染AI消息中解析出的操作按钮
 */

import React from 'react';
import { Button } from '../../../components/ui/button';
import { 
  ExternalLink, 
  Download, 
  Eye, 
  Plus, 
  Copy,
  MessageCircle,
  Navigation
} from 'lucide-react';
import { executeCommand } from '../services/actionCommandHandler';
import type { ActionButton } from '../utils/actionButtonParser';

interface ActionButtonsProps {
  /** 按钮配置数组 */
  buttons: ActionButton[];
  /** 按钮样式变体 */
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  /** 按钮大小 */
  size?: 'default' | 'sm' | 'lg';
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 根据命令类型返回合适的图标
 */
function getCommandIcon(command: string): React.ReactNode {
  // 命令图标映射
  const iconMap: Record<string, React.ReactNode> = {
    navigate_customer_sites: <Eye className="h-4 w-4" />,
    navigate_customer_detail: <Eye className="h-4 w-4" />,
    export_customer_sites: <Download className="h-4 w-4" />,
    navigate_add_site: <Plus className="h-4 w-4" />,
    navigate: <Navigation className="h-4 w-4" />,
    copy_text: <Copy className="h-4 w-4" />,
    show_message: <MessageCircle className="h-4 w-4" />,
    showReadme: <Eye className="h-4 w-4" />
  };
  
  // 通用匹配规则
  if (command.includes('navigate')) {
    return <ExternalLink className="h-4 w-4" />;
  }
  if (command.includes('export')) {
    return <Download className="h-4 w-4" />;
  }
  if (command.includes('copy')) {
    return <Copy className="h-4 w-4" />;
  }
  
  return iconMap[command] || <ExternalLink className="h-4 w-4" />;
}

/**
 * 获取按钮样式类 - 为了与聊天界面一致，统一使用ghost样式
 */
function getButtonVariant(command: string): 'default' | 'outline' | 'ghost' | 'link' {
  // 为了与聊天界面的消息操作按钮保持一致，统一使用ghost样式
  // 这样看起来更轻量，不会抢夺消息内容的视觉焦点
  return 'ghost';
}

/**
 * 获取按钮的自定义样式类
 */
function getButtonClassName(command: string): string {
  const baseClasses = "h-8 hover:bg-gray-100 transition-colors";
  
  // 主要操作按钮添加轻微的蓝色提示
  if (command.includes('navigate_customer') || command === 'navigate_customer_sites') {
    return `${baseClasses} hover:bg-blue-50 hover:text-blue-600 border-gray-200`;
  }
  
  // 导出操作添加绿色提示
  if (command.includes('export')) {
    return `${baseClasses} hover:bg-green-50 hover:text-green-600 border-gray-200`;
  }
  
  // 其他操作保持默认灰色
  return `${baseClasses} border-gray-200`;
}

/**
 * 动作按钮组件
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttons,
  variant,
  size = 'sm',
  className = ''
}) => {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  /**
   * 处理按钮点击事件
   */
  const handleButtonClick = async (button: ActionButton) => {
    await executeCommand(button.command, button.params);
  };

  return (
    <div className={`flex flex-wrap gap-2 mt-3 ${className}`}>
      {buttons.map((button, index) => {
        const buttonVariant = variant || getButtonVariant(button.command);
        const icon = getCommandIcon(button.command);
        const customClassName = getButtonClassName(button.command);
        
        // 如果指定了link样式，渲染为行内超链样式
        if (button.style === 'link') {
          return (
            <button
              key={`${button.command}-${index}`}
              onClick={() => handleButtonClick(button)}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {icon}
              <span>{button.label}</span>
            </button>
          );
        }
        
        // 默认按钮样式
        return (
          <Button
            key={`${button.command}-${index}`}
            variant={buttonVariant}
            size={size}
            onClick={() => handleButtonClick(button)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 ${customClassName}`}
          >
            {icon}
            <span>{button.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default ActionButtons;