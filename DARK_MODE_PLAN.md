# 深色模式统一支持改造计划

## 项目目标

建立统一的深色模式基础设施，让所有控件都应用可以统一控制的样式。当切换深色模式时，可以整体切换，并且以后新增的功能也都自动支持，只有特别定制化的代码才需要单独写两套CSS。

## 现状分析

### 优势
- ✅ TailwindCSS 已配置 `darkMode: ["class"]`
- ✅ 信息流功能已有基础深色模式支持（`feed-markdown.css`）
- ✅ shadcn/ui 组件天然支持深色模式

### 问题
- ❌ 大量硬编码颜色值：
  - `ModernTag.tsx`: 12个硬编码颜色值
  - `App.tsx`: 背景渐变颜色
  - `ChatMessage.css`: 约50+个颜色值
  - 约20+个文件包含硬编码颜色

- ❌ Antd 组件未配置深色主题
- ❌ 缺乏统一的设计令牌系统

## 核心方案

### 设计原则
1. **CSS变量 + TailwindCSS**: 建立设计令牌系统
2. **自动化主题切换**: 避免JavaScript重渲染开销
3. **零配置开发体验**: 使用标准类名即可支持深色模式
4. **统一管理**: 所有颜色通过CSS变量控制

### 技术架构
```
设计令牌 (CSS Variables) 
    ↓
TailwindCSS 主题配置
    ↓  
组件自动主题切换
    ↓
新功能自动支持深色模式
```

## 实施任务清单

### 🎯 第一阶段：基础设施建设

#### 1. 设计系统建立
- [ ] **创建设计令牌（Design Tokens）**
  - 在 `src/index.css` 中定义完整的CSS变量系统
  - 包含主色彩、次色彩、中性色、语义色、边框色、阴影等
  - 为亮色和深色模式分别定义变量值
  ```css
  :root {
    /* Light theme */
    --color-primary: #1677ff;
    --color-background: #ffffff;
    --color-text: #000000;
    /* ... */
  }
  
  .dark {
    /* Dark theme */
    --color-primary: #4096ff;
    --color-background: #000000;
    --color-text: #ffffff;
    /* ... */
  }
  ```

- [ ] **扩展 TailwindCSS 配置**
  - 将CSS变量映射到TailwindCSS主题
  - 在 `tailwind.config.js` 中添加自定义色彩变量
  - 确保 `dark:` 修饰符能正确工作

#### 2. 主题管理系统
- [ ] **创建主题上下文**
  - 实现 `src/contexts/ThemeContext.tsx`
  - 实现 `src/hooks/useTheme.ts` Hook
  - 支持主题切换、自动检测系统主题、本地存储偏好

- [ ] **主题切换组件**
  - 创建 `src/components/ThemeToggle.tsx`
  - 集成到应用顶部或用户菜单中

#### 3. Antd 主题统一配置
- [ ] **配置 ConfigProvider**
  - 在 `App.tsx` 中设置Antd的深色主题
  - 确保所有Antd组件自动支持主题切换
  - 处理20+个使用Antd的文件

### 🔧 第二阶段：样式系统重构

#### 4. CSS 变量化改造
- [ ] **替换硬编码颜色值**
  - `src/components/ModernTag.tsx` - 替换所有内联样式中的颜色值
  - `src/App.tsx` - 替换背景渐变中的颜色
  - `src/features/infofeed/components/InfoFeedIcon.tsx` - 替换硬编码的灰色值

- [ ] **CSS 文件变量化**
  - `src/features/chat/components/ChatMessage.css` - 将所有颜色值替换为CSS变量
  - `src/features/infofeed/components/feed-markdown.css` - 统一使用CSS变量（已有部分深色支持）
  - `src/index.css` - 统一滚动条等全局样式
  - `src/features/shared/components/ImageThumb.css` - 图片组件样式变量化

#### 5. 组件样式统一化
- [ ] **聊天组件群**
  - `src/features/chat/components/ChatInput.tsx` - 移除内联颜色，使用CSS类
  - `src/features/chat/components/ChatMessageList.tsx` - 统一消息样式系统
  - `src/features/chat/components/ChatSidebar.tsx` - 侧边栏颜色系统化
  
- [ ] **信息流组件群**
  - 验证现有深色模式是否完整
  - 补充遗漏的深色样式变量

- [ ] **需求消息组件群**
  - `src/features/chat/components/RequirementMessage/RequirementItem.tsx` - 移除内联样式
  - `src/features/chat/components/RequirementMessage/RequirementMessage.tsx` - 颜色系统化
  - `src/features/chat/components/RequirementMessage/RequirementDetail.tsx` - 统一样式变量

#### 6. 通用组件适配
- [ ] **共享组件**
  - `src/features/shared/components/ImageThumb.tsx` 和相关组件
  - `src/features/shared/components/LightboxViewer.tsx`
  - 各种模态框组件

### 🧪 第三阶段：验证和测试

#### 7. 功能验证
- [ ] **主题切换测试**
  - 验证所有页面的主题切换效果
  - 确保刷新后主题偏好保持
  - 测试自动检测系统主题

- [ ] **组件兼容性测试**
  - 测试所有Antd组件在深色模式下的显示
  - 验证自定义组件的深色模式效果
  - 检查各种交互状态（hover, active, focus）

#### 8. 边缘情况处理
- [ ] **特殊场景适配**
  - 图片和媒体内容的深色模式适配
  - 表格和数据展示的对比度优化
  - 代码高亮的深色主题适配

## 核心文件清单

### 新建文件
```
src/contexts/ThemeContext.tsx       # 主题上下文
src/hooks/useTheme.ts              # 主题Hook
src/components/ThemeToggle.tsx     # 主题切换组件
```

### 重点修改文件
```
src/index.css                      # 设计令牌定义（核心）
src/App.tsx                        # 主题系统集成
tailwind.config.js                 # 变量映射
src/features/chat/components/ChatMessage.css  # 变量化改造
src/components/ModernTag.tsx       # 移除硬编码
```

### 需要处理的硬编码颜色统计
- **十六进制颜色**: 约30+个
- **RGB/RGBA值**: 约40+个文件包含
- **内联样式颜色**: 约20+个组件

## 预期效果

### 开发体验
✅ **零配置**: 新增功能只需使用设计令牌即可自动支持深色模式  
✅ **统一管理**: 所有颜色通过CSS变量统一控制  
✅ **标准化**: 开发者使用TailwindCSS类名即可，无需关心主题适配

### 用户体验  
✅ **流畅切换**: CSS原生主题切换，无JavaScript重渲染开销  
✅ **状态保持**: 主题偏好本地存储，刷新后保持  
✅ **系统同步**: 自动检测并跟随系统主题设置

### 维护性
✅ **统一入口**: 所有主题相关配置集中管理  
✅ **扩展性**: 易于添加新的主题变量和颜色  
✅ **兼容性**: 与现有组件库（Antd, shadcn/ui）良好集成

## 优先级执行建议

1. **基础设施搭建** - 设计令牌系统和主题管理
2. **核心样式重构** - ChatMessage.css等关键文件
3. **组件系统适配** - 逐步替换硬编码颜色
4. **全面测试验证** - 确保所有场景正常工作

## 成功标准

- [ ] 一键切换深色/浅色主题
- [ ] 所有现有功能在两种主题下正常显示
- [ ] 新开发功能自动支持双主题
- [ ] 主题偏好持久化存储
- [ ] 性能无明显下降

---

**文档版本**: v1.0  
**创建时间**: 2025-08-27  
**预期完成**: 根据开发进度调整  
**负责人**: AI开发助手 + 开发团队