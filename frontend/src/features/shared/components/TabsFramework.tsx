/**
 * 通用的Tabs框架组件
 * 
 * 支持一级和二级菜单，适配移动端和桌面端
 * 基于shadcn/ui Tabs组件实现
 */

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/features/shared/utils/utils';

export interface MenuItem {
  /** 菜单项的唯一标识 */
  key: string;
  /** 菜单项显示文本 */
  label: string;
  /** 菜单项图标（可选） */
  icon?: React.ReactNode;
  /** 二级菜单项（可选） */
  subItems?: SubMenuItem[];
}

export interface SubMenuItem {
  /** 子菜单项的唯一标识 */
  key: string;
  /** 子菜单项显示文本 */
  label: string;
  /** 子菜单项图标（可选） */
  icon?: React.ReactNode;
}

export interface TabsFrameworkProps {
  /** 主菜单项列表 */
  menuItems: MenuItem[];
  /** 当前选中的主菜单项 */
  activeTab: string;
  /** 当前选中的子菜单项（如果有） */
  activeSubTab?: string;
  /** 主菜单变更回调 */
  onTabChange: (tabKey: string) => void;
  /** 子菜单变更回调 */
  onSubTabChange?: (subTabKey: string) => void;
  /** 返回按钮点击回调（可选） */
  onBackClick?: () => void;
  /** 返回按钮文本 */
  backButtonLabel?: string;
  /** 内容渲染函数 */
  children: (activeTab: string, activeSubTab?: string) => React.ReactNode;
  /** 额外的CSS类名 */
  className?: string;
}

const TabsFramework: React.FC<TabsFrameworkProps> = ({
  menuItems,
  activeTab,
  activeSubTab,
  onTabChange,
  onSubTabChange,
  onBackClick,
  backButtonLabel = '返回',
  children,
  className = ''
}) => {
  const activeMenuItem = menuItems.find(item => item.key === activeTab);
  const hasSubMenu = activeMenuItem?.subItems && activeMenuItem.subItems.length > 0;

  return (
    <div className={cn("w-full min-h-screen bg-white flex flex-col", className)}>
      {/* 固定顶部菜单区域 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        {/* 主菜单栏 */}
        <div className="px-4 md:px-6 h-[44px]">
          <div className="mx-auto max-w-3xl h-full flex items-center">
            {/* 返回按钮 */}
            {onBackClick && (
              <button
                onClick={onBackClick}
                className="flex items-center justify-center w-10 h-10 mr-4 hover:bg-muted rounded-md transition-colors touch-manipulation flex-shrink-0"
                aria-label={backButtonLabel}
              >
                <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* 主菜单 Tabs */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                {/* 移动端：隐藏滚动条的水平滚动 */}
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="w-max min-w-full h-10 bg-transparent p-0">
                    {menuItems.map((item) => (
                      <TabsTrigger
                        key={item.key}
                        value={item.key}
                        className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-muted"
                      >
                        {item.icon && <span className="text-base">{item.icon}</span>}
                        <span className="whitespace-nowrap">{item.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        {/* 二级菜单栏（可选） */}
        {hasSubMenu && activeMenuItem && activeMenuItem.subItems && (
          <div className="px-4 md:px-6 h-[44px] border-t border-gray-100">
            <div className="mx-auto max-w-3xl h-full flex items-center">
              <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="w-max min-w-full h-9 bg-transparent p-0">
                    {activeMenuItem.subItems.map((subItem) => (
                      <TabsTrigger
                        key={subItem.key}
                        value={subItem.key}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-muted/60"
                      >
                        {subItem.icon && <span className="text-sm">{subItem.icon}</span>}
                        <span className="whitespace-nowrap">{subItem.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* 顶部占位空间，避免内容被固定菜单遮挡 */}
      <div className={hasSubMenu ? "h-[88px]" : "h-[44px]"}></div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-4 md:py-6">
            {children(activeTab, activeSubTab)}
          </div>
        </div>
      </div>
    </div>
  );
};

// 命名导出
export { TabsFramework };

// 默认导出
export default TabsFramework;

// 显式导出所有类型，确保可以正确导入
export type { MenuItem, SubMenuItem, TabsFrameworkProps };