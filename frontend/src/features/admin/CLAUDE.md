# Admin功能 - CLAUDE.md

此文件为Claude Code开发后台管理功能时提供的指导文档。

## 设计理念

### shadcn/ui设计系统要求
- **统一使用shadcn/ui组件**：所有界面元素必须基于shadcn/ui组件构建
- **现代化设计感**：采用卡片式布局、阴影效果、圆角设计
- **语义化颜色系统**：使用`text-foreground`、`text-muted-foreground`、`bg-muted`等语义化类
- **交互反馈**：hover效果、过渡动画、状态变化
- **响应式设计**：移动端友好的布局和交互

### 核心组件选择
- **Layout**: 使用Card、Separator进行区域划分
- **Navigation**: 利用Button变体、Badge进行导航状态
- **Form**: 统一使用Input、Button、Select等表单组件
- **Data Display**: Table、Badge、Avatar等数据展示组件
- **Feedback**: Alert、Toast、Skeleton等反馈组件

## 组件架构

### AdminApp (主框架)
- 使用Card组件构建主要布局区域
- 左侧边栏使用独立Card，带有subtle阴影
- 顶部导航条使用Card与Separator分隔
- 内容区域使用Card容器，保持内容聚焦感

### AdminSidebar (侧边栏)
- 导航项使用Button ghost/default变体
- 激活状态使用shadcn的primary色系
- 图标与文字的间距符合shadcn设计规范
- 使用ScrollArea处理长列表滚动

### 页面组件
- 所有页面容器使用Card包装
- 页面标题使用Typography层次
- 操作按钮统一使用Button组件变体
- 表格使用Table组件及其子组件

## 颜色与视觉
- 主色调：遵循shadcn的primary色系
- 文字层次：foreground > muted-foreground > disabled
- 背景层次：background > muted > accent
- 边框：统一使用border语义类
- 圆角：遵循shadcn的rounded-lg等预设

## 交互体验
- 所有可点击元素必须有hover状态
- 使用transition-colors等过渡效果
- 表单验证使用shadcn的错误状态样式
- 加载状态使用Skeleton组件
- 操作反馈使用Toast通知

## 开发规范
1. 禁止使用原生HTML按钮，必须使用shadcn Button
2. 禁止硬编码颜色值，使用语义化CSS变量
3. 所有卡片容器使用Card组件及其子组件
4. 间距使用Tailwind的spacing scale
5. 字体大小遵循shadcn的typography设置

---
最后更新：2025-08-27
维护者：开发团队