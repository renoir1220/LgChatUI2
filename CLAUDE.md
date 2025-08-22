# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 操作本代码库时提供指导。

## 项目概览

LgChatUI2 是一个现代化的全栈聊天应用，基于 npm workspaces 的 monorepo 架构：

### 核心技术栈
- **后端**：NestJS API 服务器（TypeScript + Express + MSSQL + Feature模块化）
- **前端**：React 18+ + Vite + TypeScript + TailwindCSS + shadcn/ui
- **共享包**：@lg/shared（Zod 类型定义和校验）
- **语音服务**：集成火山引擎 TTS API（WebSocket 实时语音合成）

### 项目状态（更新于 2025-08-22）
- **代码规模**：约 9,500+ 行核心代码
- **架构状态**：已完成Feature模块化重构，结构化日志系统
- **新增功能**：BUG管理系统，支持完整的问题反馈和跟踪流程
- **质量状态**：已优化核心维护性问题，类型安全持续改进中

## Monorepo 结构

```
LgChatUI2/
├── package.json              # 根工作区配置
├── CLAUDE.md                 # 本文件：项目总览和指导
│
├── backend/                  # NestJS 后端服务
│   ├── CLAUDE.md            # 后端开发指导
│   ├── src/features/        # Feature模块化架构
│   ├── src/shared/          # 共享基础设施
│   └── dist/               # TypeScript编译输出
│
├── frontend/                # React 前端应用
│   ├── CLAUDE.md           # 前端开发指导
│   ├── src/features/       # Feature模块化架构
│   ├── src/components/     # shadcn/ui组件
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
└── packages/               # 共享包
    └── shared/            # @lg/shared 类型定义包
```

## 开发指南

### 🚀 快速启动

```bash
# 安装所有依赖
npm install

# 并行启动所有服务（推荐）
npm run dev

# 或分别启动服务
npm run dev:shared    # 启动共享包监听
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

为了避免文档过于冗长，详细的代码示例已提取到独立的 `examples/` 目录：

- **后端示例**: [`examples/backend/`](./examples/backend/)
  - `typescript-patterns.ts` - TypeScript最佳实践和错误处理
  - `api-design.ts` - RESTful和流式API设计模式
  - `database-patterns.ts` - 数据库操作和事务处理

- **前端示例**: [`examples/frontend/`](./examples/frontend/)
  - `react-patterns.tsx` - React组件设计和状态管理
  - `styling-patterns.tsx` - TailwindCSS和响应式设计
  - `api-integration.ts` - HTTP客户端和SSE流式处理

这些示例文件包含完整的实现模式，在需要参考具体实现时可以让AI读取相应文件。

### 🔧 常用命令

```bash
# 代码质量
npm run lint          # 检查所有子项目
npm run lint:fix      # 自动修复lint问题
npm run format        # 格式化代码
npm run typecheck     # TypeScript类型检查

# 构建和测试
npm run build         # 构建所有项目
npm run test          # 运行所有测试
npm run clean         # 清理构建产物

# 工具命令
npm run health        # 检查服务健康状态
npm run ports         # 查看端口占用情况
```

## 架构原则

### 🎯 设计理念
1. **Feature-First**: 按业务功能组织代码，而非技术层次
2. **单体仓库**: 统一版本管理，简化依赖关系
3. **类型安全**: 严格的TypeScript + Zod校验
4. **开发效率**: 适合1-2人小团队的架构复杂度

### 📦 Workspace 管理
- **@lg/shared**: 前后端共享的类型定义和校验规则
- **backend**: 独立的NestJS API服务
- **frontend**: 独立的React单页应用
- **自动链接**: npm workspaces自动处理内部依赖

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

## 数据库和部署

### 数据库配置
- **类型**: MSSQL Server 2008
- **测试环境**: 详见 `CLAUDE.local.md`
- **表命名规范**: 所有AI相关表以 `T_AI_` 开头

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
2. **类型错误**: 确保 @lg/shared 已构建 `npm run build:shared`
3. **数据库连接**: 验证网络和凭据配置
4. **SSE连接中断**: 检查代理配置和网络稳定性

### 调试工具
```bash
# 健康检查
npm run health

# 查看详细日志
npm run dev:be        # 后端结构化日志
npm run dev:fe        # 前端开发服务器日志

# 构建验证
npm run build:shared  # 验证共享类型
npm run typecheck     # 验证类型完整性
```

## 扩展开发

### 添加新功能
1. **规划阶段**: 确定是前端、后端还是全栈功能
2. **类型定义**: 在 `packages/shared` 中添加类型
3. **后端开发**: 在 `backend/src/features` 中创建新模块
4. **前端开发**: 在 `frontend/src/features` 中创建对应功能
5. **集成测试**: 验证前后端协作正常

### 性能优化建议
- 前端：使用 React.memo、useMemo、useCallback 优化渲染
- 后端：合理使用数据库连接池、缓存策略
- 网络：启用 HTTP 缓存、压缩静态资源

### 安全性考虑
- JWT 认证保护 API 端点
- SQL 参数化查询防止注入
- 敏感信息环境变量管理
- CORS 配置限制跨域访问

---

## 重要提醒

- **架构平衡**: 本项目面向小团队，优先功能实现和代码质量，避免过度设计
- **文档更新**: 修改架构或添加功能时，及时更新相关 CLAUDE.md 文档
- **类型优先**: 所有新功能都应从 @lg/shared 的类型定义开始
- **测试覆盖**: 核心业务逻辑必须有对应的单元或集成测试

**当前版本**: 维护性重构完成版本  
**最后更新**: 2025-01-17  
**维护者**: 开发团队
- 本项目中的release是发布的文件，平时开发时不需要读，只有处理发布相关才需要
- 不要尝试测试需要前端交互的功能，除非我要求