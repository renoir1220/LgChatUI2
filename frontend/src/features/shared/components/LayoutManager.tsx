/**
 * 布局管理组件
 * 
 * 职责：
 * - 管理整体页面布局结构
 * - 处理固定头部和内容区域的定位
 * - 计算和管理布局高度
 * - 处理头部内容的渲染和定位
 * 
 * 分离原因：
 * - 将布局逻辑从TabsFramework中分离
 * - 专门处理复杂的高度计算和定位
 * - 提供更清晰的布局抽象
 */

import React, { useMemo } from 'react';
import {
  CONTAINER_CLASSES,
  calculateHeaderHeight,
} from '../constants/FrameworkConstants';

export interface LayoutManagerProps {
  /** 顶部导航内容 */
  navigationContent: React.ReactNode;
  /** 头部额外内容（如面包屑、操作栏等） */
  headerContent?: React.ReactNode;
  /** 主要内容区域 */
  children: React.ReactNode;
  /** 是否有二级菜单（用于高度计算） */
  hasSubMenu?: boolean;
  /** 额外的CSS类名 */
  className?: string;
}

/**
 * 专用布局管理组件 - 处理所有布局相关的逻辑
 */
export const LayoutManager: React.FC<LayoutManagerProps> = ({
  navigationContent,
  headerContent,
  children,
  hasSubMenu = false,
  className = ''
}) => {
  // === 缓存布局计算 ===
  const headerHeight = useMemo(
    () => calculateHeaderHeight(hasSubMenu, Boolean(headerContent)),
    [hasSubMenu, headerContent]
  );

  const containerClasses = useMemo(
    () => `${CONTAINER_CLASSES.main} ${className}`.trim(),
    [className]
  );

  return (
    <div className={containerClasses}>
      {/* === 固定顶部区域 === */}
      <div className={CONTAINER_CLASSES.fixedHeader}>
        {/* 导航内容（主菜单 + 子菜单） */}
        {navigationContent}

        {/* 头部额外内容 */}
        {headerContent && (
          <div className="px-4 md:px-6">
            <div className="mx-auto max-w-3xl">
              {headerContent}
            </div>
          </div>
        )}
      </div>

      {/* === 占位空间（避免内容被固定头部遮挡） === */}
      <div 
        className="flex-shrink-0"
        style={{ height: `${headerHeight}px` }}
      />

      {/* === 主要内容区域 === */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className={CONTAINER_CLASSES.contentArea}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutManager;