# Backend Claude.md

此文件为 Claude Code 开发后端时提供的指导文档。

## 项目概览

**项目名称**：LgChatUI2 后端服务  
**技术栈**：NestJS + TypeScript + MSSQL + Express  
**架构模式**：Feature模块化 + 仓储模式  
**部署端口**：3000  

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
- **类型安全**: 严格的TypeScript类型检查

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
│   └── files/                 # 文件处理模块
│
└── shared/                    # 共享基础设施
    ├── database/              # 数据库连接和配置
    ├── services/              # 公共服务
    ├── filters/               # 全局异常过滤器
    ├── interceptors/          # 请求拦截器
    ├── pipes/                 # 数据验证管道
    └── utils/                 # 工具函数
```

## 核心功能模块

### 认证模块 (auth/)
- JWT认证基于用户名的简单认证
- 守卫系统自动保护需要认证的API
- 从员工数据库验证用户身份

### 聊天模块 (chat/)
- SSE实现的实时流式对话体验
- 完整的会话管理（创建、列表、重命名、删除）
- 消息存储和历史记录
- 知识库集成支持

### 语音合成模块 (tts/)
- 火山引擎WebSocket实时语音合成
- 音频缓存提高响应速度
- 多音色支持

### 共享服务 (shared/)
- 结构化日志系统（AppLoggerService）
- 全局异常过滤器统一错误响应
- MSSQL连接池管理
- Dify AI平台集成

## 数据库设计

### 数据库连接
- **类型**: MSSQL Server 2008
- **连接池**: 自动管理连接生命周期
- **事务支持**: 关键操作的ACID保证

### 核心表结构
- **T_AI_CONVERSATION**: 会话信息
- **T_AI_MESSAGE**: 消息记录
- **T_AI_USER**: 用户信息

所有AI相关表以`T_AI_`开头，便于识别和管理。

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
POST /api/chat                    # 流式聊天
GET  /api/conversations          # 获取会话列表
POST /api/conversations          # 创建新会话
PUT  /api/conversations/:id      # 重命名会话
DELETE /api/conversations/:id    # 删除会话
GET  /api/conversations/:id/messages  # 获取消息历史
POST /api/tts                    # 语音合成
```

## 开发规范

### TypeScript规范
- 使用具体类型，避免any
- 明确的错误处理和异常抛出
- 完整的接口定义

### 日志规范
- 使用AppLoggerService替代console.log
- 结构化日志包含上下文信息
- 错误日志包含堆栈信息

### 错误处理规范
- 业务异常使用NestJS标准异常类
- 系统异常记录详细日志后抛出通用异常
- 全局异常过滤器统一处理

## 代码示例

详细的代码示例和最佳实践请参考：

- **TypeScript模式**: `../examples/backend/typescript-patterns.ts`
- **API设计模式**: `../examples/backend/api-design.ts`  
- **数据库操作模式**: `../examples/backend/database-patterns.ts`

这些文件包含了完整的实现示例，涵盖：
- 控制器、服务、仓储的标准实现
- 错误处理和日志记录的最佳实践
- 数据库操作和事务处理
- API设计和流式响应处理

## 性能优化

### 数据库优化
- 使用连接池避免连接开销
- 合理的查询索引和分页
- 事务管理和批量操作

### 缓存策略
- HTTP缓存头设置
- 静态资源缓存
- 语音文件缓存

### 并发处理
- 异步操作优先
- 流式响应减少内存占用
- 合理的超时设置

## 测试策略

### 单元测试
- 业务逻辑测试覆盖率 > 70%
- 使用Jest + NestJS测试工具
- Mock外部依赖

### 集成测试
- API端点完整测试
- 数据库操作测试
- 错误场景覆盖

## 部署和运维

### 环境配置
```bash
# 示例配置 (真实配置详见 ../CLAUDE.local.md)
NODE_ENV=production
PORT=3000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
JWT_SECRET=your-secret-key
DIFY_API_URL=https://your-dify-instance
```

### 健康检查
- GET /health - 服务健康状态
- 数据库连接检查
- 外部服务依赖检查

### 日志监控
- 结构化JSON日志输出
- 错误级别日志告警
- 性能指标追踪

## 故障排查

### 常见问题
1. **数据库连接失败**: 检查网络连接和凭据
2. **JWT认证失败**: 验证token有效性和密钥配置
3. **流式响应中断**: 检查网络稳定性和超时设置
4. **内存泄漏**: 监控长连接和事件监听器

### 调试工具
```bash
npm run start:dev          # 查看运行日志
npm run test -- --testNamePattern="Chat"  # 运行特定测试
node verify_migration.js   # 数据库连接测试
```

## 扩展开发

### 添加新功能模块
1. 在 `features/` 下创建新目录
2. 创建module、controller、service文件
3. 在app.module.ts中导入新模块
4. 添加对应的测试

### 集成新的外部服务
1. 在 `shared/services/` 中创建服务类
2. 在shared.module.ts中注册
3. 通过依赖注入使用

### 数据库Schema变更
1. 在 `sql/migrations/` 中添加迁移脚本
2. 更新相关的Repository类
3. 运行迁移验证脚本

---

**注意**: 本项目面向1-2人小团队开发，架构设计平衡了合理性和复杂度。优先考虑功能实现和代码质量，避免过度设计。