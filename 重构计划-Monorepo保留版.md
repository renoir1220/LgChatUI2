# LgChatUI2 重构计划 - Monorepo 保留版

> 制定时间：2025-01-17  
> 目标：保留 npm workspaces monorepo 架构，优化代码结构和质量

## 📊 项目现状分析

### 项目规模
- **前端源码**：44 个 TS/TSX 文件
- **后端源码**：29 个 TS 文件  
- **共享包**：@lg/shared 已建立
- **架构**：npm workspaces monorepo

### 主要问题点
1. **架构混乱**：前端存在多种架构模式混用（components、features、entities、widgets、pages 等）
2. **组件过大**：ChatScreen.tsx 等核心组件代码量过大，难以维护
3. **类型安全问题**：存在大量 lint 错误和 any 类型使用
4. **重复目录结构**：frontend/frontend 嵌套目录问题
5. **依赖管理混乱**：部分地方使用了 pnpm，整体使用 npm

## 🎯 重构目标

### 保留优势
- ✅ **npm workspaces** monorepo 架构
- ✅ **@lg/shared** 类型共享包
- ✅ **三层架构**（frontend + backend + shared）
- ✅ **统一开发环境**（一键启动所有服务）

### 优化重点
- 🔧 统一前端架构模式
- 🔧 提升代码质量和类型安全
- 🔧 改善开发体验
- 🔧 组件拆分和复用

## 📁 重构后目录结构

```
LgChatUI2/
├── packages/
│   └── shared/                    # 保持现有共享包
│       ├── src/
│       │   ├── types/            # 类型定义
│       │   │   ├── api.ts        # API 相关类型
│       │   │   ├── chat.ts       # 聊天相关类型
│       │   │   ├── user.ts       # 用户相关类型
│       │   │   └── index.ts      # 统一导出
│       │   ├── schemas/          # Zod 验证模式
│       │   │   ├── chat.ts       # 聊天验证
│       │   │   ├── auth.ts       # 认证验证
│       │   │   └── index.ts      # 统一导出
│       │   ├── constants/        # 常量定义
│       │   │   ├── api.ts        # API 常量
│       │   │   ├── chat.ts       # 聊天常量
│       │   │   └── index.ts      # 统一导出
│       │   └── index.ts          # 包入口
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── backend/                       # 保持现有后端结构
│   ├── src/
│   │   ├── modules/              # 按功能模块组织
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   └── strategies/
│   │   │   ├── chat/
│   │   │   │   ├── chat.controller.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   └── chat.module.ts
│   │   │   ├── tts/
│   │   │   │   ├── tts.controller.ts
│   │   │   │   ├── tts.service.ts
│   │   │   │   ├── tts.module.ts
│   │   │   │   └── providers/
│   │   │   └── knowledge-base/
│   │   │       ├── knowledge-base.controller.ts
│   │   │       ├── knowledge-base.service.ts
│   │   │       └── knowledge-base.module.ts
│   │   ├── shared/               # 后端共享代码
│   │   │   ├── database/
│   │   │   ├── pipes/
│   │   │   ├── guards/
│   │   │   └── repositories/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/                      # 简化前端架构
│   ├── src/
│   │   ├── components/           # 展示组件
│   │   │   ├── ui/              # shadcn/ui 组件
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   ├── chat/            # 聊天相关组件
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatMessageList.tsx
│   │   │   │   ├── ChatSidebar.tsx
│   │   │   │   └── VoicePlayer.tsx
│   │   │   ├── knowledge-base/  # 知识库相关组件
│   │   │   │   ├── KnowledgeBaseSelector.tsx
│   │   │   │   ├── CitationList.tsx
│   │   │   │   └── Citation.tsx
│   │   │   ├── auth/            # 认证相关组件
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── RequireAuth.tsx
│   │   │   └── common/          # 通用组件
│   │   │       ├── ImageThumb.tsx
│   │   │       ├── LightboxViewer.tsx
│   │   │       └── ContentWithImages.tsx
│   │   ├── features/             # 功能模块（业务逻辑）
│   │   │   ├── auth/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   └── types/
│   │   │   ├── chat/
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useStreamChat.ts
│   │   │   │   │   ├── useChatActions.ts
│   │   │   │   │   └── useChatState.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── chatService.ts
│   │   │   │   ├── utils/
│   │   │   │   │   └── messageCache.ts
│   │   │   │   └── types/
│   │   │   └── knowledge-base/
│   │   │       ├── hooks/
│   │   │       │   └── useKnowledgeBases.ts
│   │   │       ├── services/
│   │   │       └── types/
│   │   ├── hooks/               # 全局自定义 hooks
│   │   │   └── useConversations.ts
│   │   ├── services/            # 全局 API 服务
│   │   │   ├── api.ts
│   │   │   └── authService.ts
│   │   ├── utils/               # 工具函数
│   │   │   ├── auth.ts
│   │   │   └── imageUtils.ts
│   │   ├── contexts/            # React contexts
│   │   │   ├── ChatContext.tsx
│   │   │   ├── NotificationContext.tsx
│   │   │   └── SettingsContext.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
└── package.json                   # 根配置保持不变
```

## 🔄 具体重构方案

### 阶段一：基础清理（优先级：🔴 高）

#### 第一周任务
1. **清理重复目录结构**
   - [ ] 移除 `frontend/frontend/` 嵌套目录
   - [ ] 统一使用 npm 包管理器（移除 pnpm 相关文件）
   - [ ] 清理无用的 node_modules

2. **修复基础配置问题**
   - [ ] 统一 TypeScript 配置
   - [ ] 修复 ESLint 配置冲突
   - [ ] 完善 @lg/shared 包构建

3. **类型安全初步修复**
   - [ ] 识别并列出所有 any 类型使用
   - [ ] 修复明显的 TypeScript 错误
   - [ ] 完善 import/export 规范

### 阶段二：架构整理（优先级：🟡 中）

#### 第二周任务
1. **前端目录重组**
   - [ ] 移除多余的架构层（entities、widgets、pages）
   - [ ] 按新的目录结构重新组织文件
   - [ ] 统一组件导入/导出规范

2. **组件拆分**
   - [ ] 拆分 ChatScreen.tsx（当前过大）
   - [ ] 提取可复用的子组件
   - [ ] 优化组件 props 设计

3. **状态管理优化**
   - [ ] 简化 Context 使用
   - [ ] 优化 hooks 依赖关系
   - [ ] 改进错误处理机制

### 阶段三：功能完善（优先级：🟢 中）

#### 第三周任务
1. **API 层优化**
   - [ ] 统一 API 调用封装
   - [ ] 完善错误处理
   - [ ] 优化类型定义

2. **用户体验改进**
   - [ ] 优化加载状态
   - [ ] 改善错误提示
   - [ ] 完善交互细节

3. **代码质量提升**
   - [ ] 添加必要的单元测试
   - [ ] 完善代码注释
   - [ ] 优化性能瓶颈

### 阶段四：性能优化（优先级：🔵 低）

#### 第四周任务
1. **构建优化**
   - [ ] 优化 Vite 配置
   - [ ] 改善热重载性能
   - [ ] 优化打包体积

2. **运行时优化**
   - [ ] 实现代码分割
   - [ ] 优化图片加载
   - [ ] 内存泄漏检查

3. **监控和文档**
   - [ ] 添加性能监控
   - [ ] 更新项目文档
   - [ ] 制定开发规范

## 📋 详细任务清单

### 立即执行（本周）
- [ ] **清理 frontend/frontend 嵌套目录**
  - 移动 `frontend/frontend/` 下的内容到 `frontend/`
  - 删除多余的目录和配置文件
  - 更新相关的路径引用

- [ ] **统一包管理器**
  - 删除 `pnpm-lock.yaml`
  - 确保所有地方使用 npm
  - 重新安装依赖

- [ ] **修复 TypeScript 基础错误**
  - 运行 `npm run lint` 识别问题
  - 修复 import/export 错误
  - 处理明显的类型问题

### 下周计划
- [ ] **重构 ChatScreen.tsx**
  - 拆分为多个子组件
  - 提取业务逻辑到 hooks
  - 优化 props 传递

- [ ] **整理目录结构**
  - 按新的架构移动文件
  - 更新所有 import 路径
  - 统一命名规范

## 🔧 保留的 Monorepo 优势

1. **统一依赖管理**
   - 继续使用 npm workspaces
   - 依赖去重和版本统一
   - 简化安装和更新流程

2. **类型共享**
   - @lg/shared 包提供类型安全
   - 前后端 API 契约一致性
   - 减少类型定义重复

3. **开发便利性**
   - 一键启动所有服务
   - 统一的构建和测试流程
   - 集中的配置管理

4. **代码复用**
   - 工具函数和常量共享
   - 验证逻辑复用
   - 统一的错误处理

## 💡 关键设计决策

### 架构原则
1. **渐进式重构**：分阶段进行，确保系统稳定性
2. **类型安全优先**：所有重构都以提升类型安全为目标
3. **开发体验优化**：改善构建速度和调试体验
4. **保持向后兼容**：重构过程中不破坏现有功能

### 技术选择
- **前端架构**：Features + Components 模式
- **状态管理**：React Context + Custom Hooks
- **类型系统**：严格的 TypeScript + Zod 验证
- **组件库**：继续使用 shadcn/ui + Tailwind CSS

## 📈 成功指标

### 代码质量指标
- [ ] ESLint 错误数量：0
- [ ] TypeScript 错误数量：0
- [ ] 代码重复率：< 5%
- [ ] 测试覆盖率：> 70%

### 开发体验指标
- [ ] 构建时间：< 30s
- [ ] 热重载时间：< 3s
- [ ] 新人上手时间：< 2h

### 性能指标
- [ ] 首屏加载时间：< 2s
- [ ] 交互响应时间：< 100ms
- [ ] 包体积：< 1MB（gzipped）

## 🚀 开始实施

### 第一步：环境准备
```bash
# 1. 备份当前代码
git checkout -b refactor-backup

# 2. 清理依赖
npm run clean:deps
npm install

# 3. 构建共享包
npm run build:shared

# 4. 检查当前状态
npm run lint
npm run typecheck
```

### 第二步：开始重构
从阶段一开始，按照清单逐项完成。每完成一个阶段，进行代码提交和测试验证。

---

**最后更新时间**：2025-01-17  
**负责人**：开发团队  
**预计完成时间**：4 周