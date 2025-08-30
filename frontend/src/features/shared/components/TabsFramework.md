# TabsFramework - 通用Tabs框架组件

基于 shadcn/ui 的 Tabs 组件实现的通用框架，支持响应式设计和嵌套菜单。

## 特性

- ✅ 基于 shadcn/ui Tabs 组件，遵循最佳实践
- ✅ 响应式设计，适配移动端和桌面端  
- ✅ 支持一级和二级菜单
- ✅ 移动端菜单水平滚动，解决溢出问题
- ✅ 可配置的返回按钮
- ✅ 完整的 TypeScript 支持
- ✅ 固定置顶菜单，内容区域可滚动

## 基本用法

### 1. 简单菜单（无二级菜单）

```tsx
import { TabsFramework, MenuItem } from '@/features/shared/components/TabsFramework';

const menuItems: MenuItem[] = [
  { key: 'tab1', label: '选项1', icon: <span>📰</span> },
  { key: 'tab2', label: '选项2', icon: <span>👤</span> },
  { key: 'tab3', label: '选项3', icon: <span>📡</span> }
];

<TabsFramework
  menuItems={menuItems}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onBackClick={() => navigate('/')}
>
  {(activeTab) => (
    <div>当前选中: {activeTab}</div>
  )}
</TabsFramework>
```

### 2. 嵌套菜单（带二级菜单）

```tsx
const menuItems: MenuItem[] = [
  {
    key: 'customer',
    label: '客户管理',
    icon: <span>👤</span>,
    subItems: [
      { key: 'list', label: '客户列表', icon: <span>📋</span> },
      { key: 'add', label: '新增客户', icon: <span>➕</span> },
      { key: 'import', label: '批量导入', icon: <span>📥</span> }
    ]
  },
  {
    key: 'orders',
    label: '订单管理', 
    icon: <span>📦</span>,
    subItems: [
      { key: 'pending', label: '待处理', icon: <span>⏳</span> },
      { key: 'completed', label: '已完成', icon: <span>✅</span> }
    ]
  }
];

<TabsFramework
  menuItems={menuItems}
  activeTab={activeTab}
  activeSubTab={activeSubTab}
  onTabChange={setActiveTab}
  onSubTabChange={setActiveSubTab}
  onBackClick={() => navigate('/')}
>
  {(activeTab, activeSubTab) => (
    <div>
      主菜单: {activeTab}
      {activeSubTab && ` > 子菜单: ${activeSubTab}`}
    </div>
  )}
</TabsFramework>
```

## API Reference

### TabsFramework Props

| 属性 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `menuItems` | `MenuItem[]` | ✅ | - | 主菜单项列表 |
| `activeTab` | `string` | ✅ | - | 当前选中的主菜单项 |
| `activeSubTab` | `string` | ❌ | - | 当前选中的子菜单项 |
| `onTabChange` | `(tabKey: string) => void` | ✅ | - | 主菜单变更回调 |
| `onSubTabChange` | `(subTabKey: string) => void` | ❌ | - | 子菜单变更回调 |
| `onBackClick` | `() => void` | ❌ | - | 返回按钮点击回调 |
| `backButtonLabel` | `string` | ❌ | '返回' | 返回按钮的 aria-label |
| `children` | `(activeTab: string, activeSubTab?: string) => ReactNode` | ✅ | - | 内容渲染函数 |
| `className` | `string` | ❌ | - | 额外的 CSS 类名 |

### MenuItem Interface

```tsx
interface MenuItem {
  key: string;           // 菜单项唯一标识
  label: string;         // 显示文本
  icon?: ReactNode;      // 图标（可选）
  subItems?: SubMenuItem[]; // 子菜单（可选）
}
```

### SubMenuItem Interface

```tsx
interface SubMenuItem {
  key: string;        // 子菜单项唯一标识
  label: string;      // 显示文本  
  icon?: ReactNode;   // 图标（可选）
}
```

## 布局结构

```
┌─────────────────────────────────────────────────┐
│ [返回] [主菜单1] [主菜单2] [主菜单3] ...        │ (固定置顶)
├─────────────────────────────────────────────────┤  
│ [子菜单1] [子菜单2] [子菜单3] ...               │ (可选，固定置顶)
├─────────────────────────────────────────────────┤
│                                                 │
│              内容区域                            │
│            (可滚动)                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 响应式行为

### 移动端 (< md)
- 菜单支持水平滚动，防止溢出
- 返回按钮显示在左侧
- 菜单项适当缩小以适应屏幕

### 桌面端 (≥ md)  
- 菜单正常展示，必要时水平滚动
- 更大的点击区域和间距
- 更好的 hover 效果

## 最佳实践

1. **菜单项数量**: 主菜单建议不超过 5-7 项，子菜单不超过 5-6 项
2. **图标选择**: 使用简洁易懂的 emoji 或图标，保持视觉一致性
3. **标签文本**: 简洁明了，避免过长文本
4. **默认选中**: 切换主菜单时，建议自动选中第一个子菜单项
5. **状态管理**: 使用 useState 或状态管理库维护选中状态

## 实际应用示例

- ✅ 信息流页面 (无二级菜单)
- ✅ 客户管理系统 (有二级菜单)  
- ✅ 系统设置页面 (无二级菜单)
- ✅ 数据分析dashboard (有二级菜单)

详细示例代码请参考 `TabsFramework.example.tsx` 文件。