# Examples - 代码示例库

此文件为 Claude Code 使用代码示例时提供的指导文档。

## 概述

examples文件夹包含了LgChatUI2项目中各种开发模式和最佳实践的代码示例，用于指导AI和开发者理解项目的设计思路和实现方法。

## 目录结构

```
examples/
├── CLAUDE.md                # 本文件：示例代码使用指导
├── backend/                 # 后端开发模式示例
│   ├── api-design.ts       # RESTful和流式API设计模式
│   ├── database-patterns.ts # 数据库操作和事务处理模式
│   └── typescript-patterns.ts # TypeScript最佳实践
└── frontend/               # 前端开发模式示例
    ├── api-integration.ts  # HTTP客户端和SSE流式处理
    ├── react-patterns.tsx  # React组件和Hook设计模式
    └── styling-patterns.tsx # TailwindCSS和响应式设计
```

## 使用说明

### 📖 阅读顺序建议

1. **新功能开发前**：先查看相关领域的示例文件了解设计模式
2. **遇到技术问题时**：参考相应的示例文件找到解决方案
3. **代码审查时**：对照示例验证是否遵循了最佳实践

### 🎯 各示例文件的用途

#### Backend 示例

- **`typescript-patterns.ts`**：
  - TypeScript严格模式的使用
  - 类型定义和接口设计
  - 错误处理模式
  - 装饰器使用规范

- **`api-design.ts`**：
  - RESTful API设计规范
  - Server-Sent Events (SSE) 实现
  - 请求验证和响应格式
  - 错误处理和状态码

- **`database-patterns.ts`**：
  - MSSQL数据库连接和查询
  - 事务处理模式
  - 数据仓储模式实现
  - 错误处理和日志记录

#### Frontend 示例

- **`react-patterns.tsx`**：
  - React组件设计模式
  - Hook的创建和使用
  - Context状态管理
  - 组件生命周期和性能优化

- **`styling-patterns.tsx`**：
  - TailwindCSS最佳实践
  - 响应式设计模式
  - 组件样式组织
  - 主题系统使用

- **`api-integration.ts`**：
  - HTTP客户端封装
  - SSE连接处理
  - 错误重试机制
  - 请求缓存策略

### 🔧 如何使用示例

#### 对于 Claude AI

```typescript
// 在需要参考特定模式时，读取相关示例文件
// 例如：需要实现新的API端点时
const exampleFile = await readFile('examples/backend/api-design.ts');
// 然后基于示例中的模式实现新功能
```

#### 对于开发者

1. **复制模式**：直接复制示例中的代码结构
2. **理解原理**：通过注释理解设计思路
3. **适配需求**：根据具体业务需求调整实现

## 📝 示例更新原则

### 何时更新示例

- 项目中出现了新的设计模式
- 现有模式有重大改进或修正
- 添加了新的技术栈或工具
- 发现更优的最佳实践

### 更新规范

- **完整性**：示例代码应该是可运行的完整片段
- **注释详细**：每个关键点都要有中文注释说明
- **最新技术**：保持与项目主代码的技术栈同步
- **实际场景**：基于项目中的真实使用场景编写

## 🎓 学习路径

### 新手开发者

1. 从`typescript-patterns.ts`开始，理解项目的TypeScript规范
2. 学习`react-patterns.tsx`了解React组件设计
3. 参考`styling-patterns.tsx`掌握样式系统
4. 最后学习API集成模式

### 有经验开发者

1. 直接查看相关领域的示例文件
2. 重点关注项目特有的设计模式
3. 参考错误处理和性能优化部分

### AI使用指南

1. **功能实现前**：先读取相关示例文件理解模式
2. **代码生成时**：严格按照示例中的模式和规范
3. **问题解决时**：在示例中查找类似的解决方案

## 🚀 最佳实践

### 代码质量

- 所有示例都通过TypeScript严格模式检查
- 遵循项目的ESLint和Prettier规范
- 包含完整的错误处理
- 提供性能优化建议

### 架构设计

- 遵循Feature-First的组织原则
- 展示独立项目架构的优势
- 体现前后端类型一致性
- 演示模块化和可扩展性

### 文档完整性

- 每个模式都有详细的使用说明
- 包含常见问题和解决方案
- 提供实际应用场景
- 持续更新和维护

---

**重要提醒**：这些示例代码是项目开发的重要参考资料，请确保在实现新功能时参考相应的示例模式，保持代码风格和架构的一致性。

**最后更新**：2025-08-25  
**维护者**：开发团队