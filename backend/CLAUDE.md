# Backend Claude.md

此文件为 Claude Code 开发后端时提供的指导文档。

## 项目概览

**项目名称**：LgChatUI2 后端服务（独立项目）  
**技术栈**：NestJS + TypeScript + MSSQL + Express  
**架构模式**：Feature模块化 + 仓储模式 + 独立类型系统  
**部署端口**：3000  
**API架构**：RESTful + Server-Sent Events (SSE)  

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式启动（热重载）
npm run start:dev

# 生产模式启动
npm run start:prod

# 构建
npm run build

# 测试
npm run test
npm run test:watch
npm run test:e2e

# 代码质量
npm run lint        # ESLint检查和自动修复
npm run format      # Prettier格式化
```

## 项目架构

### 核心架构原则
- **Feature-First**: 按业务功能组织代码，而非技术层次
- **模块化**: 每个feature独立成NestJS模块
- **共享服务**: 通用功能集中在shared模块
- **类型安全**: 严格的TypeScript类型检查和独立类型系统
- **API设计**: RESTful风格 + SSE流式数据传输
- **错误处理**: 全局异常过滤器 + 结构化日志

### 目录结构

```
src/
├── main.ts                    # 应用入口
├── app.module.ts              # 根模块
├── health.controller.ts       # 健康检查
│
├── features/                  # 业务功能模块
│   ├── auth/                  # 用户认证模块
│   ├── chat/                  # 聊天功能模块
│   ├── tts/                   # 语音合成模块
│   ├── knowledge-base/        # 知识库模块
│   ├── bugs/                  # BUG管理模块
│   ├── suggestions/           # 建议管理模块
│   ├── infofeed/              # 信息流模块
│   ├── requirements/          # 需求管理模块
│   ├── crm-customer/          # CRM客户信息模块
│   └── files/                 # 文件处理模块
│
├── shared/                    # 共享基础设施
│   ├── database/              # 数据库连接和配置
│   ├── services/              # 公共服务（Logger、Dify等）
│   ├── filters/               # 全局异常过滤器
│   ├── interceptors/          # 请求拦截器（日志、请求ID）
│   ├── pipes/                 # 数据验证管道
│   └── utils/                 # 工具函数
│
└── types/                     # 后端类型定义
    ├── api.ts                 # API响应类型
    ├── chat.ts                # 聊天相关类型
    ├── user.ts                # 用户相关类型
    └── ...                    # 其他业务类型
```

## 核心功能模块

### 认证模块 (auth/)
- **CRM集成认证**: 基于密码的CRM登录验证系统
- **AES加密**: 严格按照CRM文档实现的Token加密算法
- **用户管理**: 从CRM.VIEW_EMPLOYEE获取用户信息，使用CRM_USER_ID作为主键
- **JWT认证**: 包含CRM_USER_ID的JWT Token生成和验证
- **守卫系统**: 自动保护需要认证的API
- **错误处理**: 完整的CRM错误代码映射和友好消息

### 聊天模块 (chat/)
- SSE实现的实时流式对话体验
- 完整的会话管理（创建、列表、重命名、删除）
- 消息存储和历史记录
- 知识库集成支持

### 语音合成模块 (tts/)
- 火山引擎WebSocket实时语音合成
- 音频缓存提高响应速度
- 多音色支持

### 业务功能模块
- **BUG管理**: 完整生命周期管理、图片上传、优先级状态管理
- **建议管理**: 用户建议收集、开发者回复、状态跟踪
- **信息流**: 社交媒体式信息流、分类浏览、评论点赞系统
- **CRM客户**: 客户信息查询、站点列表、装机信息汇总
- **后台管理**: AdminGuard权限保护、渐进式页面接入

### 共享服务 (shared/)
- **结构化日志系统**: AppLoggerService提供统一日志记录
- **全局异常过滤器**: 统一错误响应格式
- **数据库连接**: MSSQL连接池管理（LgChatUI + CRM双库支持）
- **CRM服务**: 集成CRM API的认证验证服务
- **AES工具**: CRM Token加密解密工具类
- **Dify AI平台集成**: 对话AI服务集成

## 数据库设计

### 数据库连接
- **类型**: MSSQL Server 2008
- **连接池**: 自动管理连接生命周期
- **事务支持**: 关键操作的ACID保证

### 核心表结构
所有AI相关表以`AI_`开头：
- **AI_CONVERSATIONS**: 会话信息
- **AI_MESSAGES**: 消息记录  
- **AI_USER**: 用户信息
- **AI_BUGS**: BUG管理信息
- **AI_SUGGESTIONS**: 建议管理信息

## API设计

### RESTful风格
- 使用标准HTTP方法和状态码
- 统一的错误响应格式
- 支持分页和过滤

### 流式API
- SSE(Server-Sent Events)实时数据推送
- 会话ID通过HTTP头返回
- 完善的流中错误事件处理

### 主要API端点
```
# 核心功能
POST /api/chat                    # 流式聊天
GET  /api/conversations          # 会话管理
POST /api/tts                    # 语音合成

# 业务功能  
POST /api/bugs                   # BUG管理
POST /api/suggestions            # 建议管理
GET  /api/infofeed               # 信息流
GET  /api/crm-customer/sites/:id # CRM客户信息
GET  /api/requirements/search    # 需求多关键词搜索
GET  /api/questions/search       # 常见问题多关键词搜索

# 后台管理
GET  /api/admin/*                # 后台管理（AdminGuard保护）
```

> 📖 **API详细文档**: 
> - Requirements API: [`../docs/REQUIREMENTS_API.md`](../docs/REQUIREMENTS_API.md)
> - Questions API: [`../docs/QUESTIONS_API.md`](../docs/QUESTIONS_API.md)

## 开发规范

### TypeScript & 日志规范
- **类型安全**: 使用具体类型，避免any，完整的接口定义
- **结构化日志**: 使用AppLoggerService，包含上下文信息和堆栈
- **错误处理**: NestJS标准异常类，全局异常过滤器统一处理

## 代码示例

详细的代码示例和最佳实践请参考 `../examples/backend/` 目录，包含：
- TypeScript最佳实践和错误处理
- API设计模式和流式响应处理
- 数据库操作和事务处理

## 技术要点

### 性能优化
- **数据库**: 连接池、索引优化、事务管理
- **缓存**: HTTP缓存头、静态资源缓存、语音文件缓存  
- **并发**: 异步优先、流式响应、合理超时

### 测试策略
- **单元测试**: 业务逻辑覆盖率>70%，Jest+NestJS工具
- **集成测试**: API端点、数据库操作、错误场景覆盖

## 部署运维 & 开发扩展

### 环境配置
```bash
# 示例配置 (真实配置详见 ../CLAUDE.local.md)
NODE_ENV=production
PORT=3000
DB_HOST=your-database-host
JWT_SECRET=your-secret-key
DIFY_API_URL=https://your-dify-instance
```

### 监控调试
- **健康检查**: GET /health - 服务状态、数据库连接检查
- **日志监控**: 结构化JSON输出、错误告警、性能追踪
- **常见问题**: 数据库连接、JWT认证、流式响应、内存泄漏

### 扩展开发工作流
1. **新功能模块**: `features/` 目录创建 module、controller、service
2. **外部服务集成**: `shared/services/` 创建服务类，依赖注入使用
3. **数据库变更**: `sql/migrations/` 迁移脚本，更新Repository类

---

**架构理念**: 面向小团队开发，平衡合理性与复杂度，优先功能实现和代码质量。