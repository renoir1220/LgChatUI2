/**
 * 当前客户显示条
 * 显示当前选中的客户名称，并提供一个按钮来选择其他客户
 */

import React from 'react';
import { ChevronDown, Building2, User } from 'lucide-react';

export interface CurrentCustomerBarProps {
  /** 当前客户名称 */
  customerName?: string;
  /** 点击选择客户时的回调 */
  onSelectCustomer?: () => void;
  /** 页面标题 */
  pageTitle?: string;
  /** 额外的右侧内容（如统计徽章等） */
  rightContent?: React.ReactNode;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 当前客户显示条组件 - 简洁版本，融入页面整体风格
 */
export const CurrentCustomerBar: React.FC<CurrentCustomerBarProps> = ({
  customerName,
  onSelectCustomer,
  pageTitle,
  rightContent,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between py-2 px-1 border-b border-gray-100 ${className}`}>
      <div className="flex items-center gap-3 text-sm">
        {pageTitle && (
          <span className="font-medium text-gray-900">{pageTitle}</span>
        )}
        
        {pageTitle && customerName && (
          <div className="h-4 w-px bg-gray-300"></div>
        )}
        
        {!customerName ? (
          <div className="flex items-center gap-2 text-gray-500">
            <User className="h-4 w-4" />
            <span>请选择客户</span>
            {onSelectCustomer && (
              <button
                onClick={onSelectCustomer}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors px-1 py-0.5 rounded"
              >
                选择
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">{customerName}</span>
            {onSelectCustomer && (
              <button
                onClick={onSelectCustomer}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors px-1 py-0.5 rounded hover:bg-gray-50"
              >
                切换
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {rightContent && (
        <div className="flex items-center">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default CurrentCustomerBar;