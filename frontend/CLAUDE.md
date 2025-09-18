# Frontend Claude.md

此文件为 Claude Code 开发前端时提供的指导文档。

## 开发要求

### 样式系统规范
- **复用优先**: 优先使用已创建的标准样式和TailwindCSS/shadcn默认样式
- **组件化**: 创建共享、可复用的组件促进代码标准统一
- **架构原则**: 遵循职责分离、组件组合等现代React最佳实践

### 组件设计标准
- **单一职责**: 每个组件只负责一个明确的功能 
- **组合模式**: 使用组合而非继承，提高组件灵活性
- **性能优化**: 合理使用React.memo、useMemo等优化手段
- **类型安全**: 严格的TypeScript类型定义和接口设计

## 项目概览

**项目名称**：LgChatUI2 前端应用（独立项目）  
**技术栈**：React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui  
**架构模式**：Feature-Based + Context + Hooks + 独立类型系统  
**开发端口**：5173  
**PWA支持**：离线缓存和桌面安装  

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
- **类型安全**: 严格的TypeScript类型检查和独立类型系统
- **状态管理**: Context + useReducer模式
- **样式系统**: TailwindCSS + CSS模块化
- **PWA功能**: Service Worker + 离线缓存 + Manifest配置

### 目录结构

```
src/
├── main.tsx                   # 应用入口
├── App.tsx                    # 根组件
├── index.css                  # 全局样式
├── sw.ts                      # Service Worker配置
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
├── types/                     # 前端类型定义
│   ├── api.ts                 # API接口类型
│   ├── chat.ts                # 聊天相关类型
│   ├── user.ts                # 用户相关类型
│   └── ...                    # 其他业务类型
│
└── utils/                     # 通用工具函数
```

## 核心功能模块

### 认证模块 (auth/)
- **密码登录**: 支持用户名和密码的CRM认证登录
- **UI优化**: 现代化登录界面，支持密码输入和错误提示
- **RequireAuth组件**: 保护需要认证的页面
- **认证状态管理**: localStorage存储JWT Token和用户信息
- **后端集成**: 与CRM登录验证系统无缝集成

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
- **TabsFramework架构**: 组合式Tabs组件系统（TabsNavigator + LayoutManager + FrameworkConstants）
- **设计系统**: 统一的常量管理和样式规范
- **智能组件**: 图片展示、预览和消息提示系统
- **HTTP客户端**: 统一的API请求处理
- **PWA功能**: Service Worker、离线缓存和更新提示

### 类型系统 (types/)
- 前端独立的TypeScript类型定义
- 与后端API接口约定保持一致
- 完整的类型安全保障

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
- **接口设计**: 明确的Props接口定义和类型约束
- **Ref传递**: 使用forwardRef进行组件ref传递
- **性能优化**: React.memo、useMemo、useCallback合理使用
- **错误处理**: 错误边界和异常情况处理
- **职责分离**: 遵循单一职责原则，组件功能聚焦
- **组合优于继承**: 使用组合模式提高组件复用性

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

## 架构重构成果

### TabsFramework组件系统重构（2025-08-31）

**重构背景**：原TabsFramework组件违反单一职责原则，200+行代码混合了导航、布局、逻辑处理等多种职责。

**重构成果**：
- **职责分离**: 拆分为3个专职组件
  - `FrameworkConstants.ts` - 设计系统常量中心化管理
  - `TabsNavigator.tsx` - 导航逻辑和菜单处理
  - `LayoutManager.tsx` - 布局管理和高度计算
- **性能优化**: 添加useMemo缓存，避免不必要的重渲染
- **代码简化**: 主组件从200+行精简到100行
- **架构清晰**: 采用组合模式，提高可测试性和可维护性

**技术特色**：
```typescript
// 组合式架构示例
const TabsFramework = (props) => {
  const navigationContent = <TabsNavigator {...navProps} />;
  
  return (
    <LayoutManager 
      navigationContent={navigationContent}
      headerContent={headerContent}
      hasSubMenu={hasSubMenu}
    >
      {children(activeTab, activeSubTab)}
    </LayoutManager>
  );
};
```

## 代码示例

详细的代码示例和最佳实践请参考 `../examples/frontend/` 目录，包含：
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

### 路径导入规范
**必须使用路径别名，避免相对路径导入**：
```typescript
// ✅ 推荐：使用路径别名
import { InfoFeed, ApiResponse } from '@types/infofeed';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/features/shared/services/api';

// ❌ 禁止：使用相对路径
import { InfoFeed } from '../../../types/infofeed';
import { Button } from '../../components/ui/button';
import { apiGet } from '../shared/services/api';
```

**配置的路径别名**：
- `@` → `./src` (根目录别名)
- `@types` → `./src/types` (类型文件别名)

**优势**：
- 重构时路径不易出错
- 代码更简洁易读
- IDE自动完成更好
- 避免 `../../../` 等复杂相对路径

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