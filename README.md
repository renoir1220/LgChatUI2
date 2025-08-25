# LgChatUI2

一个基于现代技术栈的全栈AI聊天应用，支持智能对话、知识库问答和语音合成功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)

## ✨ 特性

- 🤖 **智能对话**: 基于Dify AI平台的自然语言交互
- 📚 **知识库问答**: 支持文档上传和专业领域问答
- 🎵 **语音合成**: 集成火山引擎TTS，支持多音色语音播放
- 💬 **流式对话**: 实时SSE流式响应，提供流畅的对话体验
- 🔒 **用户认证**: 基于JWT的安全认证系统
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🎨 **现代UI**: 基于shadcn/ui的美观界面设计
- 🚀 **PWA支持**: 离线缓存和桌面安装
- 🐛 **BUG管理**: 完整的问题反馈和跟踪系统
- 💡 **建议管理**: 用户建议收集和处理

## 🏗️ 技术架构

### 后端 (NestJS)
- **框架**: NestJS + TypeScript
- **数据库**: MSSQL Server 2008
- **认证**: JWT + 企业员工系统集成
- **API设计**: RESTful + SSE流式接口
- **外部服务**: Dify AI平台、火山引擎TTS

### 前端 (React)
- **框架**: React 18 + TypeScript + Vite
- **UI组件**: shadcn/ui + Ant Design X
- **样式系统**: TailwindCSS
- **状态管理**: Context + useReducer
- **构建工具**: Vite

### 架构特点
- **独立项目**: 前后端独立开发和部署
- **类型一致**: 通过API接口约定保持类型同步
- **代码质量**: ESLint + Prettier + TypeScript严格模式
- **开发效率**: 统一的开发脚本和构建流程

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
├── backend/                 # NestJS后端服务（独立项目）
│   ├── package.json        # 后端依赖配置
│   ├── src/
│   │   ├── features/       # 功能模块（聊天、认证、TTS等）
│   │   ├── shared/         # 共享基础设施
│   │   └── types/          # 后端类型定义
│   └── CLAUDE.md           # 后端开发指导
├── frontend/               # React前端应用（独立项目）
│   ├── package.json        # 前端依赖配置
│   ├── src/
│   │   ├── features/       # 功能模块
│   │   ├── components/     # UI组件
│   │   └── types/          # 前端类型定义
│   └── CLAUDE.md           # 前端开发指导
├── examples/               # 代码示例库
│   ├── backend/            # 后端开发模式
│   ├── frontend/           # 前端开发模式
│   └── CLAUDE.md           # 示例代码指导
├── release/                # 发布配置
│   ├── scripts/           # 打包和发布脚本
│   └── config-templates/  # Docker和nginx配置模板
├── package.json            # 根项目开发脚本
└── CLAUDE.md               # 项目总览
```

## 🎯 核心功能

### 智能对话
- 支持多轮对话上下文记忆
- 实时流式响应显示
- 会话管理（创建、重命名、删除）
- 消息历史记录

### 知识库问答
- 动态知识库选择和切换
- 基于向量搜索的精准问答
- 知识来源引用显示
- 点击查看完整引用内容

### BUG管理
- BUG提交表单（标题、描述、优先级）
- 图片上传支持（最多5张截图）
- BUG状态跟踪
- 开发者分配和处理

### 建议管理
- 建议提交和收集
- 建议列表展示和筛选
- 开发者回复和状态更新

### 语音功能
- 文本转语音播放
- 多种音色选择
- 音频缓存优化
- 实时语音合成

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

## 📊 项目统计

- **代码规模**: 约10,000+行TypeScript代码
- **组件数量**: 40+个React组件
- **API端点**: 20+个RESTful接口 + SSE流式接口
- **数据表**: 7个核心业务表
- **PWA功能**: Service Worker + 离线缓存 + Manifest配置

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

### v2.1.0 (2025-08-25)
- 🔄 完成从Monorepo到独立项目的架构迁移
- 🚀 实现PWA功能，支持离线使用和桌面安装
- 🐛 新增完整的BUG管理系统
- 💡 新增建议管理系统
- 📦 优化发布和部署流程
- 🔧 完善类型系统和错误处理

### v2.0.0 (2025-01-17)
- ✨ 完成Feature模块化架构
- 🎨 升级到shadcn/ui设计系统
- 📚 添加完整的开发文档体系

### v1.x
- 🎉 初始版本发布
- 💬 基础聊天功能
- 📖 知识库集成
- 🎵 语音合成功能

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

**注意**: 本项目面向小团队开发，架构设计平衡了功能完整性与复杂度，优先考虑开发效率和代码质量。