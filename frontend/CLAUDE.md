# Frontend Claude.md

此文件为 Claude Code 开发前端时提供的指导文档。

## 项目概览

**项目名称**：LgChatUI2 前端应用  
**技术栈**：React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui  
**架构模式**：Feature-Based + Context + Hooks  
**开发端口**：5173  

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式启动（热重载）
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview

# 代码质量检查
npm run lint
```

## 项目架构

### 设计理念
- **Feature-First**: 按业务功能组织代码结构
- **组件复用**: 基于shadcn/ui的设计系统
- **类型安全**: 严格的TypeScript类型检查
- **状态管理**: Context + useReducer模式
- **样式系统**: TailwindCSS + CSS模块化

### 目录结构

```
src/
├── main.tsx                   # 应用入口
├── App.tsx                    # 根组件
├── index.css                  # 全局样式
│
├── components/                # 通用UI组件
│   └── ui/                    # shadcn/ui组件库
│
├── features/                  # 业务功能模块
│   ├── auth/                  # 用户认证功能
│   ├── chat/                  # 聊天功能模块
│   ├── knowledge-base/        # 知识库功能模块
│   ├── bugs/                  # BUG提交功能模块
│   ├── suggestions/           # 建议提交功能模块
│   └── shared/               # 共享功能模块
│
```

## 核心功能模块

### 认证模块 (auth/)
- 基于用户名的简单登录
- RequireAuth组件保护需要认证的页面
- localStorage存储认证状态

### 聊天模块 (chat/)
- 基于SSE的流式消息接收
- 完整的会话管理（创建、切换、重命名、删除）
- 富文本消息渲染和图片支持
- 集成TTS语音播放功能
- 本地缓存优化用户体验

### 知识库模块 (knowledge-base/)
- 动态选择对话使用的知识库
- 显示AI回答的知识来源
- 点击查看完整引用内容

### BUG管理模块 (bugs/)
- BUG提交模态框组件（标题、描述、优先级选择）
- 图片上传组件（支持最多5张截图）
- 响应式设计，垂直居中显示
- 集成到聊天界面加号按钮菜单

### 建议管理模块 (suggestions/)
- 建议提交和查看功能
- 建议列表展示和筛选
- 开发者回复查看

### 共享模块 (shared/)
- 智能图片展示和预览
- 全局消息提示系统
- 统一的HTTP请求处理

## 状态管理

### Context + Hooks 模式
使用React的Context API结合useReducer实现状态管理：

- **单一数据源**: 每个功能模块有独立的Context
- **不可变更新**: 使用useReducer确保状态不可变
- **类型安全**: 所有状态和操作都有完整的TypeScript类型

### 自定义Hook设计
创建专门的Hook来封装业务逻辑：
- `useConversations` - 会话管理
- `useChatActions` - 聊天操作
- `useStreamChat` - 流式消息处理
- `useKnowledgeBases` - 知识库选择

## 组件设计

### shadcn/ui 设计系统
基于Radix UI的高质量组件库：
- 完全可定制的样式
- 内置可访问性支持
- TypeScript类型安全
- 与TailwindCSS无缝集成

### 组件开发规范
- 明确的Props接口定义
- 使用forwardRef进行ref传递
- React.memo优化性能
- 错误边界处理

## 样式系统

### TailwindCSS + CSS模块
- **TailwindCSS**: 主要的样式系统，实现响应式设计
- **CSS模块**: 用于复杂动画和特殊效果
- **设计系统**: 基于shadcn/ui的一致性设计
- **主题支持**: 完整的明暗主题切换

### 响应式设计
采用移动优先的响应式设计：
- 移动端优先的断点设计
- 灵活的布局系统
- 自适应的组件行为

## API集成

### HTTP客户端
统一的API请求处理：
- 自动认证token管理
- 统一错误处理
- 请求重试机制
- 响应缓存策略

### SSE流式数据处理
实时聊天的核心技术：
- EventSource管理
- 流式数据解析
- 错误恢复机制
- 连接状态监控

## 代码示例

详细的代码示例和最佳实践请参考：

- **React模式**: `../examples/frontend/react-patterns.tsx`
- **样式系统**: `../examples/frontend/styling-patterns.tsx`
- **API集成**: `../examples/frontend/api-integration.ts`

这些文件包含了完整的实现示例，涵盖：
- 组件设计和状态管理的最佳实践
- TailwindCSS和响应式设计模式
- HTTP客户端和SSE流式处理
- 错误处理和性能优化技巧

## 性能优化

### 组件优化
- React.memo避免不必要的重渲染
- useMemo缓存计算结果
- useCallback缓存事件处理器
- 合理的组件拆分

### 代码分割和懒加载
- 路由级别的代码分割
- 组件级别的懒加载
- 资源预加载策略

### 网络优化
- API响应缓存
- 图片懒加载
- 静态资源压缩

## 开发规范

### TypeScript规范
- 严格的类型定义，避免any
- 完整的接口定义
- 泛型类型约束
- 明确的事件处理器类型

### Hook开发规范
- 遵循Hook使用规则
- 完整的依赖数组
- 合理的状态设计
- 错误边界处理

## 测试策略

### 组件测试
使用React Testing Library：
- 用户行为驱动的测试
- 可访问性测试
- 组件交互测试

### Hook测试
使用@testing-library/react-hooks：
- Hook逻辑单元测试
- 状态变化测试
- 副作用测试

## 构建和部署

### Vite配置
- 开发服务器代理配置
- 构建优化配置
- 环境变量管理
- 代码分割策略

### 环境配置
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 故障排查

### 常见问题
1. **白屏问题**: 检查路由配置和错误边界
2. **API调用失败**: 验证后端服务状态和CORS配置
3. **SSE连接中断**: 检查网络稳定性和事件监听器
4. **样式不生效**: 确认TailwindCSS配置和类名拼写

### 调试工具
- React Developer Tools
- Chrome DevTools Network tab
- Vite的热重载日志
- TypeScript编译错误提示

---

**注意**: 前端架构设计注重开发效率和用户体验，使用现代React生态最佳实践，同时保持代码的可维护性和可扩展性。