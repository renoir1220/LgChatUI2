/**
 * TabsFramework设计系统常量
 * 统一管理所有布局、样式和交互相关的常量值
 */

// === 布局高度常量 ===
export const LAYOUT_HEIGHTS = {
  /** 主菜单栏高度 */
  MAIN_TAB: 44,
  /** 二级菜单栏高度 */
  SUB_TAB: 40,
  /** 头部内容区域预估高度 */
  HEADER_CONTENT: 42,
  /** 返回按钮区域宽度 */
  BACK_BUTTON_WIDTH: 40,
} as const;

// === Z-Index层级常量 ===
export const Z_INDEX = {
  /** 固定头部菜单层级 */
  FIXED_HEADER: 40,
  /** 模态框层级 */
  MODAL: 50,
  /** 工具提示层级 */
  TOOLTIP: 60,
} as const;

// === 响应式断点和容器 ===
export const RESPONSIVE = {
  /** 内容容器最大宽度 */
  MAX_CONTENT_WIDTH: 'max-w-3xl',
  /** 移动端水平内边距 */
  MOBILE_PADDING_X: 'px-4',
  /** 桌面端水平内边距 */
  DESKTOP_PADDING_X: 'md:px-6',
} as const;

// === 主题色彩常量 ===
export const THEME_COLORS = {
  /** 主色调 - 激活状态 */
  PRIMARY: {
    border: 'border-blue-500',
    text: 'text-gray-900',
    background: 'bg-white',
  },
  /** 次要色调 - 未激活状态 */
  SECONDARY: {
    border: 'border-transparent',
    text: 'text-gray-500',
    hover: 'hover:text-gray-700',
  },
  /** 二级菜单色调 */
  SUB_MENU: {
    background: 'bg-gray-50/50',
    primary_border: 'border-blue-400',
    primary_text: 'text-gray-700',
    secondary_text: 'text-gray-400',
    secondary_hover: 'hover:text-gray-600',
  },
  /** 分割线和边框 */
  BORDERS: {
    light: 'border-gray-100',
    normal: 'border-gray-200',
    separator: 'bg-gray-300',
  },
} as const;

// === 动画和过渡 ===
export const ANIMATIONS = {
  /** 标准过渡时间 */
  TRANSITION: 'transition-colors',
  /** 标准过渡持续时间 */
  DURATION: 'duration-200',
  /** 缓动函数 */
  EASE: 'ease-out',
} as const;

// === 交互区域尺寸 ===
export const TOUCH_TARGETS = {
  /** 最小触控区域高度 */
  MIN_HEIGHT: 44,
  /** 推荐触控区域高度 */
  RECOMMENDED_HEIGHT: 48,
  /** 图标尺寸 */
  ICON_SIZE: {
    main: 'text-base', // 主菜单图标
    sub: 'text-sm',   // 二级菜单图标
  },
} as const;

// === 间距系统 ===
export const SPACING = {
  /** 菜单项间距 */
  MENU_ITEM_GAP: 'gap-2',
  /** 子菜单项间距 */
  SUB_MENU_ITEM_GAP: 'gap-1.5',
  /** 内容区域上下间距 */
  CONTENT_PADDING_Y: 'py-4 md:py-6',
} as const;

// === CSS类名组合函数 ===
export const getTabTriggerClasses = (isActive: boolean, isSubMenu: boolean = false) => {
  const baseClasses = 'relative flex items-center bg-transparent border-b-2 font-medium transition-colors';
  
  if (isSubMenu) {
    const subMenuClasses = `${SPACING.SUB_MENU_ITEM_GAP} px-3 py-1.5 text-sm`;
    return `${baseClasses} ${subMenuClasses} ${
      isActive 
        ? `${THEME_COLORS.SUB_MENU.primary_border} ${THEME_COLORS.SUB_MENU.primary_text}`
        : `${THEME_COLORS.SECONDARY.border} ${THEME_COLORS.SUB_MENU.secondary_text} ${THEME_COLORS.SUB_MENU.secondary_hover}`
    }`;
  }
  
  const mainMenuClasses = `${SPACING.MENU_ITEM_GAP} px-4 py-2`;
  return `${baseClasses} ${mainMenuClasses} ${
    isActive 
      ? `${THEME_COLORS.PRIMARY.border} ${THEME_COLORS.PRIMARY.text}`
      : `${THEME_COLORS.SECONDARY.border} ${THEME_COLORS.SECONDARY.text} ${THEME_COLORS.SECONDARY.hover}`
  }`;
};

// === 布局计算函数 ===
export const calculateHeaderHeight = (hasSubMenu: boolean, hasHeaderContent: boolean): number => {
  return (
    LAYOUT_HEIGHTS.MAIN_TAB +
    (hasSubMenu ? LAYOUT_HEIGHTS.SUB_TAB : 0) +
    (hasHeaderContent ? LAYOUT_HEIGHTS.HEADER_CONTENT : 0)
  );
};

// === 容器类名组合 ===
export const CONTAINER_CLASSES = {
  /** 主容器 */
  main: 'w-full min-h-screen bg-white flex flex-col',
  /** 固定头部 */
  fixedHeader: `fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200`,
  /** 内容包装器 */
  contentWrapper: `${RESPONSIVE.MAX_CONTENT_WIDTH} ${RESPONSIVE.MOBILE_PADDING_X} ${RESPONSIVE.DESKTOP_PADDING_X}`,
  /** 主菜单栏 */
  mainTabBar: `${RESPONSIVE.MOBILE_PADDING_X} ${RESPONSIVE.DESKTOP_PADDING_X} h-[44px]`,
  /** 子菜单栏 */
  subTabBar: `${RESPONSIVE.MOBILE_PADDING_X} ${RESPONSIVE.DESKTOP_PADDING_X} h-[40px] ${THEME_COLORS.SUB_MENU.background}`,
  /** 内容区域 */
  contentArea: `mx-auto ${RESPONSIVE.MAX_CONTENT_WIDTH} ${RESPONSIVE.MOBILE_PADDING_X} ${RESPONSIVE.DESKTOP_PADDING_X} ${SPACING.CONTENT_PADDING_Y}`,
} as const;