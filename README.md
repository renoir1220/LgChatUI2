# LgChatUI2

一个现代化的全栈聊天应用，集成AI对话、客户管理、信息流处理等企业级功能，采用独立项目架构设计。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.0-green.svg)

## ✨ 核心特性

### 🤖 AI对话系统
- **智能聊天**: 基于Dify AI平台的自然语言交互
- **知识库问答**: 动态知识库切换，支持专业领域问答
- **流式响应**: 实时SSE流式对话，提供流畅的用户体验
- **语音合成**: 集成火山引擎TTS，支持多音色语音播放

### 👥 客户管理系统 (CRM)
- **客户信息管理**: 完整的客户档案和联系信息
- **站点信息查询**: 客户相关站点的详细信息展示
- **数据字典管理**: 标准化的客户分类和状态管理
- **响应式界面**: 支持桌面和移动端的客户信息浏览

### 📰 信息流管理
- **信息聚合**: 多渠道信息的统一展示和管理
- **分类筛选**: 灵活的信息分类和标签系统
- **实时更新**: 支持信息的实时推送和更新

### 🔧 系统管理
- **后台管理**: 完整的系统配置和数据管理界面
- **用户认证**: 基于JWT的企业级认证系统
- **权限控制**: 细粒度的功能权限管理
- **BUG管理**: 完整的问题反馈和跟踪系统
- **建议管理**: 用户建议收集和处理流程

### 🎨 用户体验
- **现代UI**: 基于shadcn/ui的精美界面设计
- **响应式设计**: 完美适配桌面和移动设备
- **PWA支持**: 离线缓存和桌面应用安装
- **TabsFramework**: 统一的标签页架构，提升用户体验

## 🏗️ 技术架构

### 后端 (NestJS)
- **核心框架**: NestJS + TypeScript + Express
- **数据库**: MSSQL Server 2008 (企业级数据存储)
- **架构模式**: Feature模块化 + 共享基础设施
- **认证系统**: JWT + 企业员工系统集成
- **API设计**: RESTful + SSE流式接口
- **外部服务**: Dify AI平台、火山引擎TTS
- **功能模块**: 15+个独立业务模块 (auth, chat, crm-customer, admin等)

### 前端 (React)
- **核心框架**: React 18 + TypeScript + Vite
- **UI组件库**: shadcn/ui + Ant Design X
- **样式系统**: TailwindCSS (原子化CSS)
- **状态管理**: Context + useReducer (轻量级状态管理)
- **构建工具**: Vite (快速热重载和构建)
- **功能模块**: 9+个业务功能模块

### 架构特点
- **独立项目架构**: 前后端完全独立，各自维护依赖和类型
- **Feature-First设计**: 按业务功能组织代码结构
- **类型安全**: 严格的TypeScript类型系统，禁用any类型
- **企业级质量**: ESLint + Prettier + 结构化日志
- **小团队优化**: 适合1-2人开发团队的复杂度平衡

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- MSSQL Server 2008+

### 安装与启动

```bash
# 克隆仓库
git clone <repository-url>
cd LgChatUI2

# 安装前后端依赖
cd backend && npm install && cd ../frontend && npm install && cd ..

# 启动所有服务（推荐）
npm run dev

# 或分别启动
npm run dev:be      # 启动后端 (localhost:3000)
npm run dev:fe      # 启动前端 (localhost:5173)
```

### 环境配置

创建 `backend/.env` 文件：

```env
NODE_ENV=development
PORT=3000

# 数据库配置 (真实配置详见 CLAUDE.local.md)
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# Dify AI配置
DIFY_API_URL=https://your-dify-instance
DIFY_API_KEY=your-dify-api-key

# 火山引擎TTS配置
TTS_APP_ID=your-volcengine-app-id
TTS_ACCESS_KEY=your-volcengine-access-key
```

## 📁 项目结构

```
LgChatUI2/
├── package.json              # 根项目配置（v0.5.0）
├── CLAUDE.md                 # 项目开发指导
├── CLAUDE.local.md          # 本地环境配置（不提交）
│
├── backend/                  # NestJS 后端服务（独立项目）
│   ├── package.json         # 后端依赖配置
│   ├── CLAUDE.md           # 后端开发指导  
│   ├── src/
│   │   ├── features/       # 业务功能模块
│   │   │   ├── auth/       # 用户认证系统
│   │   │   ├── chat/       # AI聊天功能
│   │   │   ├── crm-customer/  # 客户管理
│   │   │   ├── infofeed/   # 信息流管理
│   │   │   ├── admin/      # 后台管理
│   │   │   ├── bugs/       # BUG管理
│   │   │   ├── suggestions/# 建议管理
│   │   │   ├── tts/        # 语音合成
│   │   │   └── ...         # 其他15+功能模块
│   │   ├── shared/         # 共享基础设施
│   │   │   ├── database/   # 数据库连接
│   │   │   ├── guards/     # 认证守卫
│   │   │   ├── filters/    # 异常过滤器
│   │   │   └── utils/      # 工具函数
│   │   └── types/          # 后端类型定义
│   └── dist/               # TypeScript编译输出
│
├── frontend/                # React 前端应用（独立项目）
│   ├── package.json        # 前端依赖配置
│   ├── CLAUDE.md           # 前端开发指导
│   ├── src/
│   │   ├── features/       # 业务功能模块
│   │   │   ├── auth/       # 认证界面
│   │   │   ├── chat/       # 聊天界面
│   │   │   ├── customer/   # 客户管理界面
│   │   │   ├── infofeed/   # 信息流界面
│   │   │   ├── admin/      # 后台管理界面
│   │   │   ├── shared/     # 共享组件和Hook
│   │   │   └── ...         # 其他9+功能模块
│   │   ├── components/     # shadcn/ui组件
│   │   │   └── ui/         # UI基础组件
│   │   ├── types/          # 前端类型定义
│   │   └── lib/            # 工具库
│   └── dist/               # Vite构建输出
│
├── examples/               # 代码示例和最佳实践
│   ├── backend/            # 后端编码示例
│   └── frontend/           # 前端编码示例
│
└── release/                # 发布和部署配置
    ├── scripts/           # 构建脚本
    └── config-templates/  # 配置模板
```

## 🎯 核心功能详解

### 🤖 AI对话系统
- **多轮对话**: 支持上下文记忆的智能对话
- **知识库问答**: 动态切换知识库，专业领域精准回答
- **流式响应**: SSE实时流式显示，提供流畅体验
- **会话管理**: 创建、重命名、删除会话，历史记录保存
- **语音播放**: 集成火山引擎TTS，多音色语音合成

### 👥 CRM客户管理
- **客户档案**: 完整的客户信息管理和展示
- **站点查询**: 客户相关站点信息的详细展示
- **数据字典**: 客户分类、状态等标准化管理
- **响应式界面**: 桌面和移动端完美适配
- **搜索筛选**: 灵活的客户信息搜索和筛选

### 📰 信息流管理
- **信息聚合**: 多渠道信息的统一管理平台
- **分类系统**: 灵活的信息分类和标签管理
- **实时更新**: 支持信息的实时推送和状态同步
- **TabsFramework**: 统一的标签页架构

### 🔧 系统管理功能
- **后台管理**: 完整的系统配置和数据管理
- **BUG跟踪**: 问题提交、状态跟踪、开发者分配
- **建议收集**: 用户建议提交、处理和反馈机制
- **用户认证**: JWT认证 + 企业员工系统集成
- **权限控制**: 基于角色的功能权限管理

## 🛠️ 开发指南

### 代码规范
- 使用TypeScript严格模式，禁止any类型
- 遵循ESLint和Prettier配置
- 组件设计遵循单一职责原则
- API设计遵循RESTful规范

### 测试策略
```bash
# 运行所有测试
npm run test

# 后端测试
npm run test:be

# 前端测试  
npm run test:fe

# 端到端测试
npm run test:e2e
```

### 构建部署
```bash
# 构建所有项目
npm run build

# 分别构建
npm run build:be     # 构建后端
npm run build:fe     # 构建前端
```

## 📊 项目规模统计

- **代码总量**: 约12,000+行核心TypeScript代码
- **后端模块**: 15+个功能模块 (auth, chat, crm-customer, admin, bugs等)
- **前端模块**: 9+个业务功能模块
- **API接口**: 30+个RESTful接口 + 多个SSE流式接口
- **数据库表**: AI_开头的核心业务表 (MSSQL Server)
- **UI组件**: 基于shadcn/ui的现代化组件系统
- **当前版本**: v0.5.0 (持续迭代中)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 提交规范
```
类型(范围): 简短描述

详细描述（可选）

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

## 📝 更新日志

### v0.5.0 (当前版本) - 2025-09-01
- 👥 **新增CRM客户管理系统**: 完整的客户信息管理和站点查询功能
- 📰 **信息流管理优化**: 统一的信息聚合和分类展示系统
- 🏗️ **TabsFramework重构**: 实现统一的标签页架构，提升用户体验
- 📱 **响应式优化**: 移动端适配和用户界面改进
- 🔧 **后台管理完善**: 系统配置和数据管理功能增强

### v0.4.x - 2025-08-31
- 🔄 **架构重构完成**: 独立项目架构，Feature模块化架构完善
- 🚀 **PWA功能集成**: 离线缓存和桌面应用安装支持
- 🐛 **BUG管理系统**: 完整的问题反馈和跟踪流程
- 💡 **建议管理系统**: 用户建议收集和处理机制
- 📦 **构建流程优化**: 发布和部署脚本完善

### v0.3.x - 2025-08-25
- ✨ **Feature模块化**: 完成按业务功能的代码组织重构
- 🎨 **shadcn/ui升级**: 现代化UI组件库集成
- 🔒 **认证系统**: JWT + 企业员工系统集成
- 📚 **文档体系**: 完整的开发指导文档

### v0.2.x - 2025-01-17
- 💬 **AI聊天功能**: 基于Dify的智能对话系统
- 📖 **知识库集成**: 动态知识库问答功能
- 🎵 **语音合成**: 火山引擎TTS集成
- 🔄 **流式响应**: SSE实时流式对话

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

## 🔗 相关链接

- [Dify AI平台](https://dify.ai/)
- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [Ant Design X](https://x.ant.design/)
- [火山引擎TTS](https://www.volcengine.com/products/tts)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 发送邮件至项目维护者

---

## 🎯 项目定位与特点

**LgChatUI2** 是一个面向小团队的现代化全栈企业级应用，在功能完整性与开发复杂度之间找到最佳平衡点：

- **企业级功能**: AI对话、CRM管理、信息流处理等完整业务功能
- **小团队友好**: 适合1-2人开发团队的架构设计和代码组织
- **技术前沿**: TypeScript严格模式、Feature模块化、现代化UI组件
- **开发效率**: 独立项目架构、统一开发脚本、完善的文档体系
- **质量保证**: ESLint + Prettier + 结构化日志 + 类型安全

**适用场景**: 企业内部工具、客户管理系统、AI应用集成、信息管理平台

> 📌 **开发理念**: 追求简洁、合理和最佳实践，在遇到复杂问题时停下来寻求最优解，而不是使用复杂的变通方案。