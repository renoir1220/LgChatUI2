/**
 * 通用的Tabs框架组件
 * 
 * 支持一级和二级菜单，适配移动端和桌面端
 * 基于shadcn/ui Tabs组件实现
 * 
 * v3.0 - 架构重构版本：
 * - 组件职责分离：TabsNavigator + LayoutManager
 * - 简化主组件接口和逻辑
 * - 提高可维护性和可测试性
 * - 保持向后兼容性
 */

import React, { useMemo } from 'react';
import TabsNavigator, { type MenuItem } from './TabsNavigator';
import LayoutManager from './LayoutManager';

// === 重新导出类型，保持向后兼容性 ===
export type { MenuItem, SubMenuItem } from './TabsNavigator';

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
  /** 顶部额外内容（显示在菜单下方、内容区域上方） */
  headerContent?: React.ReactNode;
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
  headerContent,
  children,
  className = ''
}) => {
  // === 性能优化：缓存计算结果 ===
  const hasSubMenu = useMemo(() => {
    const activeMenuItem = menuItems.find(item => item.key === activeTab);
    return Boolean(activeMenuItem?.subItems && activeMenuItem.subItems.length > 0);
  }, [menuItems, activeTab]);

  // 处理ESC键返回
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onBackClick) {
        event.preventDefault();
        onBackClick();
      }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 清理监听器
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBackClick]);

  // === 创建导航组件 ===
  const navigationContent = (
    <TabsNavigator
      menuItems={menuItems}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onTabChange={onTabChange}
      onSubTabChange={onSubTabChange}
      onBackClick={onBackClick}
      backButtonLabel={backButtonLabel}
    />
  );

  return (
    <LayoutManager
      navigationContent={navigationContent}
      headerContent={headerContent}
      hasSubMenu={hasSubMenu}
      className={className}
    >
      {children(activeTab, activeSubTab)}
    </LayoutManager>
  );
};

// 命名导出
export { TabsFramework };

// 默认导出
export default TabsFramework;

// 类型已通过 export interface 导出，无需重复导出