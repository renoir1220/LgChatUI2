/**
 * 信息流图标组件
 * 
 * 用于替换原有的灯泡图标，作为信息流功能的入口
 */

import React from 'react';
import { ReadOutlined } from '@ant-design/icons';

interface InfoFeedIconProps {
  className?: string;
  onClick?: () => void;
  hasUnread?: boolean;
}

const InfoFeedIcon: React.FC<InfoFeedIconProps> = ({ 
  className = '', 
  onClick,
  hasUnread = false 
}) => {
  return (
    <button 
      className={`relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border-none bg-transparent cursor-pointer flex items-center justify-center ${className}`}
      onClick={onClick}
      aria-label="信息流"
      style={{
        width: 32,
        height: 32,
        minWidth: 32,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* 信息流图标 - 使用阅读相关的图标 */}
      <ReadOutlined 
        style={{ 
          fontSize: 16,
          color: '#666666'
        }} 
      />

      {/* 未读提示红点 */}
      {hasUnread && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
      )}
    </button>
  );
};

export default InfoFeedIcon;