# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 操作本代码库时提供指导。

## 项目概览

LgChatUI2 是一个现代化的全栈聊天应用，采用独立项目架构：

### 核心技术栈
- **后端**：NestJS API 服务器（TypeScript + Express + MSSQL + Feature模块化）
- **前端**：React 18+ + Vite + TypeScript + TailwindCSS + shadcn/ui
- **类型系统**：前后端各自维护独立的TypeScript类型定义
- **语音服务**：集成火山引擎 TTS API（WebSocket 实时语音合成）

### 项目状态（更新于 2025-08-31）
- **代码规模**：约 12,000+ 行核心代码
- **架构状态**：独立项目架构，Feature模块化完成，组件架构重构完成
- **新增功能**：BUG管理、建议管理、后台管理、PWA离线支持
- **质量状态**：TabsFramework组件重构完成，类型安全和开发效率持续改进

## 项目结构

```
LgChatUI2/
├── package.json              # 根项目配置（开发脚本）
├── CLAUDE.md                 # 本文件：项目总览和指导
│
├── backend/                  # NestJS 后端服务（独立项目）
│   ├── CLAUDE.md            # 后端开发指导
│   ├── package.json         # 后端依赖配置
│   ├── src/features/        # Feature模块化架构
│   ├── src/shared/          # 共享基础设施
│   ├── src/types/           # 后端类型定义
│   └── dist/               # TypeScript编译输出
│
├── frontend/                # React 前端应用（独立项目）
│   ├── CLAUDE.md           # 前端开发指导
│   ├── package.json        # 前端依赖配置
│   ├── src/features/       # Feature模块化架构
│   ├── src/components/     # shadcn/ui组件
│   ├── src/types/          # 前端类型定义
│   └── dist/              # Vite构建输出
│
├── examples/               # 代码示例和最佳实践
│   ├── backend/            # 后端编码示例
│   │   ├── typescript-patterns.ts    # TypeScript最佳实践
│   │   ├── api-design.ts            # API设计模式
│   │   └── database-patterns.ts     # 数据库操作模式
│   └── frontend/           # 前端编码示例
│       ├── react-patterns.tsx       # React组件和Hook模式
│       ├── styling-patterns.tsx     # TailwindCSS样式模式
│       └── api-integration.ts       # API集成和SSE处理
│
└── release/                # 发布和部署配置
    ├── scripts/           # 打包和发布脚本
    └── config-templates/  # Docker和nginx配置模板
```

## 开发指南

### 🚀 快速启动

```bash
# 安装前后端依赖
cd backend && npm install && cd ../frontend && npm install

# 并行启动所有服务（推荐）
npm run dev

# 或分别启动服务
npm run dev:be        # 启动后端服务 (localhost:3000)
npm run dev:fe        # 启动前端服务 (localhost:5173)
```

### 📁 子项目文档

当开发特定模块时，请参考相应的详细文档：

- **后端开发**: 查看 [`backend/CLAUDE.md`](./backend/CLAUDE.md)
  - NestJS架构、API设计、数据库操作
  - Feature模块开发、错误处理、日志系统
  - 聊天流式API、语音合成、认证系统、BUG管理

- **前端开发**: 查看 [`frontend/CLAUDE.md`](./frontend/CLAUDE.md)
  - React架构、状态管理、组件设计
  - TailwindCSS样式系统、shadcn/ui组件
  - SSE流式处理、语音播放、用户交互、BUG提交

### 📚 代码示例库

详细的代码示例已提取到 `examples/` 目录，包含完整的实现模式供AI参考：

- **后端示例**: `examples/backend/` - TypeScript最佳实践、API设计模式、数据库操作
- **前端示例**: `examples/frontend/` - React组件设计、TailwindCSS样式、API集成

### 🔧 常用命令

```bash
# 构建项目
npm run build:be      # 构建后端项目
npm run build:fe      # 构建前端项目
npm run build         # 构建所有项目

# 工具命令
npm run health        # 检查服务健康状态
npm run ports         # 查看端口占用情况
```

## 架构原则

### 🎯 设计理念
1. **Feature-First**: 按业务功能组织代码，而非技术层次
2. **独立项目**: 前后端独立开发和部署，简化复杂性
3. **类型安全**: 严格的TypeScript类型系统
4. **开发效率**: 适合1-2人小团队的架构复杂度

### 📦 项目管理
- **backend/**: 独立的NestJS API服务，包含完整的类型定义
- **frontend/**: 独立的React单页应用，包含完整的类型定义
- **类型同步**: 通过API接口约定保持前后端类型一致性
- **独立部署**: 各项目可独立构建、测试和部署

### 🔄 数据流
```
Frontend (React) 
    ↓ HTTP/SSE
Backend (NestJS) 
    ↓ SQL
Database (MSSQL)
    ↓ WebSocket  
External AI (Dify)
```

## 开发规范

### TypeScript 严格模式要求
- **禁止使用 any 类型**：必须使用具体类型或 unknown
- **变量作用域检查**：确保所有变量在使用前已正确声明
- **接口类型严格匹配**：对象字面量必须符合接口定义
- **导入未使用变量清理**：及时删除未使用的导入和变量

### 代码质量标准
```typescript
// ✅ 正确：使用具体类型和结构化日志
interface ChatRequest {
  message: string;
  conversationId?: string;
  knowledgeBaseId?: string;
}

const handleChat = async (request: ChatRequest) => {
  this.logger.log('处理聊天请求', { 
    messageLength: request.message.length,
    hasConversation: !!request.conversationId 
  });
  // ...
};

// ❌ 错误：避免any类型和console.log
const handleChat = (request: any) => {
  console.log('handling chat:', request);
  // ...
};
```

### Git 提交规范
```bash
# 功能提交格式
git commit -m "实现会话重命名功能

- 添加重命名对话框组件
- 更新后端API支持会话标题修改
- 增加前端状态管理

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 架构最佳实践

### 组件设计原则
- **职责分离**: 每个组件只负责一个明确的功能
- **组件组合**: 使用组合模式而非继承，提高灵活性
- **性能优化**: 合理使用React.memo、useMemo等优化手段
- **类型安全**: 严格的TypeScript类型定义和接口设计

### 后台管理（Admin）模式
采用"后端优先"的增量开发方式：
- 后端：统一挂载在 `/api/admin/*`，由 `AdminGuard` 保护
- 前端：通过聊天界面用户菜单访问，新页面方式打开 `/admin`
- 渐进式开发：先骨架后功能，确保每个步骤可用

## 数据库和部署

### 数据库配置
- **类型**: MSSQL Server 2008
- **测试环境**: 详见 `CLAUDE.local.md`
- **表命名规范**: 所有AI相关表以 `AI_` 开头

### 构建产物说明
- **backend/dist/**: TypeScript编译后的JavaScript文件，生产环境运行入口
- **frontend/dist/**: Vite打包后的静态文件，可直接部署到Web服务器

### 环境配置
```bash
# .env 示例 (真实配置详见 CLAUDE.local.md)
NODE_ENV=development
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
JWT_SECRET=your-jwt-secret
DIFY_API_URL=https://your-dify-instance
```

## 故障排查

### 常见问题
1. **服务启动失败**: 检查端口占用 `npm run ports`
2. **依赖安装问题**: 分别在frontend和backend目录执行`npm install`
3. **数据库连接**: 验证网络和凭据配置
4. **SSE连接中断**: 检查代理配置和网络稳定性
5. **类型错误**: 确保前后端类型定义保持同步

### 调试工具
```bash
# 健康检查
npm run health

# 查看详细日志
npm run dev:be        # 后端结构化日志
npm run dev:fe        # 前端开发服务器日志

# 构建验证
npm run build:be      # 验证后端构建
npm run build:fe      # 验证前端构建
```

### 开发工作流
1. **功能规划**: 确定前端、后端或全栈需求
2. **类型定义**: 在对应项目的 `src/types/` 中添加类型
3. **模块开发**: 在 `features/` 目录中按业务功能组织
4. **集成测试**: 验证前后端协作和构建正常

---

## 重要提醒

- **架构平衡**: 本项目面向小团队，优先功能实现和代码质量，避免过度设计
- **文档更新**: 修改架构或添加功能时，及时更新相关 CLAUDE.md 文档
- **类型一致**: 确保前后端类型定义通过API接口约定保持一致
- **测试覆盖**: 核心业务逻辑必须有对应的单元或集成测试

**当前版本**: 组件架构重构完成版本  
**最后更新**: 2025-08-31  
**维护者**: 开发团队

**重要提醒**：
- 本项目中的release是发布的文件，开发时只在处理发布相关才读取
- 遇到无法解决的步骤时停下等待配合，追求简洁和最佳实践
- 不要测试需要前端交互的功能，除非明确要求