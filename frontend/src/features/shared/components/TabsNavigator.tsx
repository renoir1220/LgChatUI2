/**
 * Tabs导航组件
 * 
 * 职责：
 * - 专门处理一级和二级菜单的导航逻辑
 * - 渲染导航元素（主菜单、子菜单、返回按钮）
 * - 管理菜单状态和交互
 * 
 * 分离原因：
 * - TabsFramework职责过重，需要分离导航关注点
 * - 提高组件的可复用性和可测试性
 * - 简化主组件的复杂度
 */

import React, { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CONTAINER_CLASSES,
  THEME_COLORS,
  getTabTriggerClasses,
  TOUCH_TARGETS,
} from '../constants/FrameworkConstants';

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

export interface TabsNavigatorProps {
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
}

/**
 * 专用导航组件 - 处理所有导航相关的渲染和逻辑
 */
export const TabsNavigator: React.FC<TabsNavigatorProps> = ({
  menuItems,
  activeTab,
  activeSubTab,
  onTabChange,
  onSubTabChange,
  onBackClick,
  backButtonLabel = '返回'
}) => {
  // === 性能优化：缓存计算结果 ===
  const activeMenuItem = useMemo(
    () => menuItems.find(item => item.key === activeTab),
    [menuItems, activeTab]
  );
  
  const hasSubMenu = useMemo(
    () => Boolean(activeMenuItem?.subItems && activeMenuItem.subItems.length > 0),
    [activeMenuItem]
  );

  // === 渲染主菜单 ===
  const renderMainMenu = () => (
    <div className={CONTAINER_CLASSES.mainTabBar}>
      <div className={`${CONTAINER_CLASSES.contentWrapper} mx-auto h-full flex items-center`}>
        {/* 返回按钮 */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="flex items-center justify-center w-10 h-10 mr-4 hover:bg-muted rounded-md transition-colors touch-manipulation flex-shrink-0"
            style={{ minHeight: TOUCH_TARGETS.MIN_HEIGHT }}
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
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className={`w-max min-w-full h-10 bg-transparent p-0 ${THEME_COLORS.BORDERS.normal}`}>
                {menuItems.map((item) => (
                  <TabsTrigger
                    key={item.key}
                    value={item.key}
                    className={getTabTriggerClasses(item.key === activeTab)}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span className="whitespace-nowrap font-medium">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );

  // === 渲染二级菜单 ===
  const renderSubMenu = () => {
    if (!hasSubMenu || !activeMenuItem?.subItems) return null;

    return (
      <div className={CONTAINER_CLASSES.subTabBar}>
        <div className={`${CONTAINER_CLASSES.contentWrapper} mx-auto h-full flex items-center`}>
          <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className={`w-max min-w-full h-8 bg-transparent p-0 ${THEME_COLORS.BORDERS.normal}`}>
                {activeMenuItem.subItems.map((subItem) => (
                  <TabsTrigger
                    key={subItem.key}
                    value={subItem.key}
                    className={getTabTriggerClasses(subItem.key === activeSubTab, true)}
                  >
                    {subItem.icon && <span className="text-sm">{subItem.icon}</span>}
                    <span className="whitespace-nowrap font-medium">{subItem.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderMainMenu()}
      {renderSubMenu()}
    </>
  );
};

export default TabsNavigator;