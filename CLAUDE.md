# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 操作本代码库时提供指导。

## 项目概览

LgChatUI2 是一个全栈聊天应用，包含：
- **后端**：NestJS API 服务器（基于 TypeScript 和 Express）
- **前端**：React + Vite + TypeScript + TailwindCSS + shadcn
- **架构**：前后端作为同级目录独立部署

## 开发命令

### 后端（NestJS）
```bash
cd backend
npm install                    # 安装依赖
npm run start                  # 启动开发服务器（端口 3000）
npm run start:dev              # 带热重载的开发模式
npm run start:debug            # 调试模式（���热重载）
npm run build                  # 构建生产版本
npm run start:prod             # 运行生产版本
npm run test                   # 运行单元测试
npm run test:watch             # 测试监听模式
npm run test:cov               # 带覆盖率的测试
npm run test:e2e               # 端到端测试
npm run lint                   # ESLint 自动修复
npm run format                 # Prettier 格式化
```

### 前端（React + Vite）
```bash
cd frontend
npm install                    # 安装依赖
npm run dev                    # 启动开发服务器（热重载）
npm run build                  # 构建生产版本
npm run preview                # 预览生产版本
npm run lint                   # ESLint 检查
```

## 架构详情

### 后端结构
- **入口文件**：`backend/src/main.ts` - NestJS 应用启动
- **主模块**：`backend/src/app.module.ts` - 根模块配置
- **控制器**：`backend/src/app.controller.ts` - REST API 端点
- **服务层**：`backend/src/app.service.ts` - 业务逻辑
- **测试**：Jest 配置的单元测试和端到端测试

### 前端结构
- **入口文件**：`frontend/src/main.tsx` - React 应用根节点
- **构建工具**：Vite + React 插件 + SWC
- **样式系统**：TailwindCSS 4.x + shadcn/ui
- **组件目录**：`frontend/src/components/`（含 shadcn/ui 配置）
- **路径别名**：`@` 映射到 `frontend/src/`（通过 Vite 配置）

## 关键配置文件

- **后端**：`backend/nest-cli.json`、`backend/tsconfig.json`
- **前端**：`frontend/vite.config.ts`、`frontend/components.json`
- **公共配置**：双目录的 ESLint 和 TypeScript 配置

## 共享定义（npm workspaces + Zod）

- 位置：`packages/shared`（包名：`@lg/shared`）
- 功能：集中存放前后端共享的 TypeScript 定义（DTO、枚举、错误码、分页、Zod 校验）。
- 依赖：`zod@^3.23.8`，`typescript@~5.8.3`（使用 ESM 输出 + `.d.ts`）。
- 构建：`npm run build -w @lg/shared`（或 `npm run dev -w @lg/shared` 监听）。
- 导出：`@lg/shared` 根导出（`dist/index.js` / `dist/index.d.ts`）。

### 使用方式

1. 在仓库根目录安装并建立工作区：
   - `npm install`（workspaces 会自动链接 `frontend` / `backend` / `packages/shared`）
2. 本地开发：
   - 先构建或监听 shared：`npm run dev:shared`（监听）/ `npm run build:shared`（一次构建）
   - 启动后端：`npm run dev:be`（Nest）
   - 启动前端：`npm run dev:fe`（Vite）
3. 代码示例：
   ```ts
   // 后端/前端均可
   import { ChatMessageSchema, MessageCreateSchema, UserRole } from '@lg/shared'
   ```

> 说明：请优先在 shared 中定义/更新 DTO 与校验（Zod 为单一事实来源），后端使用 Zod 校验请求，前端共享类型与校验逻辑，避免重复定义与漂移。

## 开发工作流

1. 启动后端：`cd backend && npm run start:dev`
2. 启动前端：`cd frontend && npm run dev`
3. 后端地址：http://localhost:3000
4. 前端地址：http://localhost:5173（Vite 默认端口）
- 数据库是mssql2008，测试地址为：192.168.200.246,uid:pathnet,pwd:4s3c2a1p,databse:ai_test
- 前端使用shadcn，如果缺少对应的组件，从shadcn获取后使用
- 尽量不要自己写css，优先shadcn和tailwind样式，尽量不要自己写自定义元组件，如button，用shadcn的
- lgchatui是一个参考项目，我要把它移植到新的frontend和backend下

- 每次完成任务，都获取一下IDE中是否有报错，有的话解决掉
- 每次完成改动都commit一下，改动说明用中文