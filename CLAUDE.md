# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 操作本代码库时提供指导。

## 项目概览

LgChatUI2 是一个全栈聊天应用，基于 npm workspaces 的 monorepo 架构：

### 核心架构
- **后端**：NestJS API 服务器（TypeScript + Express + MSSQL）
- **前端**：React 18+ + Vite + TypeScript + TailwindCSS + shadcn/ui
- **共享包**：@lg/shared（Zod 类型定义和校验）
- **语音服务**：集成火山引擎 TTS API（WebSocket 实时语音合成）

### 项目统计（截至 2025-01-17）
- **代码规模**：64 个 TS/TSX 文件，约 7,852 行核心代码
- **依赖管理**：npm workspaces，3 个子包
- **代码质量**：前端 60 个 lint 问题，后端 151 个 lint 问题（需重构）

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
- **入口**：`backend/src/main.ts` - NestJS 应用启动（端口 3000）
- **核心模块**：`backend/src/app.module.ts` - 根模块配置
- **控制器层**：
  - `chat.controller.ts` - 聊天对话 API（SSE 流式响应）
  - `auth.controller.ts` - 用户认证（JWT）
  - `tts.controller.ts` - 语音合成（火山引擎 WebSocket）
  - `knowledge-base.controller.ts` - 知识库管理
  - `files.controller.ts` - 文件预览代理
- **数据层**：
  - `database/database.service.ts` - MSSQL 连接池
  - `repositories/` - 数据访问层（conversations、messages、users）
- **外部服务**：`services/dify.service.ts` - Dify AI 平台集成

### 前端结构
- **入口**：`frontend/src/main.tsx` - React 18 应用根节点
- **核心组件**：
  - `ChatScreen.tsx` - 主聊天界面（983 行，需拆分）
  - `CitationList.tsx` - 知识库引用展示
  - `VoicePlayer.tsx` - 语音播放控件
- **状态管理**：
  - `contexts/ChatContext.tsx` - 聊天状态管理
  - `hooks/useKnowledgeBases.ts` - 知识库选择逻辑
- **工具层**：
  - `utils/messageCache.ts` - 消息缓存（Cookie 存储）
  - `lib/api.ts` - API 请求封装

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

## TypeScript 常见错误和正确写法

### import 语法规范

**❌ 错误写法：运行时值使用 `import type`**
```typescript
// 错误：Zod schema 和 enum 在运行时需要使用，不能用 import type
import type { ChatRequestSchema, ChatRole } from '@lg/shared';

// 使用时报错：'ChatRequestSchema' cannot be used as a value
new ZodValidationPipe(ChatRequestSchema)  // ❌
```

**✅ 正确写法：区分类型和值的导入**
```typescript
// 运行时需要的值（schema、enum、常量）用普通 import
import { ChatRequestSchema, ChatRole } from '@lg/shared';

// 仅用于类型声明的接口用 import type  
import type { ChatRequest, ChatMessage, Conversation } from '@lg/shared';

// 使用正确
new ZodValidationPipe(ChatRequestSchema)  // ✅
```

### 装饰器中的类型引用

**❌ 错误写法：装饰器中直接导入类型**
```typescript
import { Response } from 'express';

@Res() res: Response  // ❌ TS1272 错误
```

**✅ 正确写法：使用 namespace 导入**
```typescript
import * as express from 'express';

@Res() res: express.Response  // ✅
```

### 类型定义规范

**❌ 错误写法：混用不同库的同名类型**
```typescript
import { Response } from 'express';
import type { Response } from '@lg/shared';  // 冲突！

private writeSSE(res: Response) {}  // 不明确是哪个 Response
```

**✅ 正确写法：明确类型来源**
```typescript
import * as express from 'express';
import type { ChatMessage } from '@lg/shared';

private writeSSE(res: express.Response) {}  // ✅ 明确来源
```

### ESLint 配置要点

- **react-refresh/only-export-components**: UI组件文件同时导出组件和工具函数是正常的，可以忽略此警告
- **react-hooks/exhaustive-deps**: useEffect 依赖数组必须包含所有使用的值，避免闭包陷阱
- **@typescript-eslint/no-explicit-any**: 避免使用 `any` 类型，使用具体类型或 `unknown`

### 依赖管理规范

```typescript
// ❌ 错误：useEffect 依赖缺失
useEffect(() => {
  actions.loadData();  // actions 没有在依赖数组中
}, []);

// ✅ 正确：包含所有依赖或直接调用 API
useEffect(() => {
  const loadData = async () => {
    const data = await api.getData();  // 直接调用，无需依赖
    dispatch({ type: 'SET_DATA', payload: data });
  };
  loadData();
}, []);  // 空依赖数组是安全的
```
- 本项目西能的数据库表名要以T_AI开头，如：T_AI_MESSAGE

## 编码规范和质量要求

### TypeScript 严格模式要求
- **禁止使用 any 类型**：必须使用具体类型或 unknown，避免类型安全问题
- **变量作用域检查**：确保所有变量在使用前已正确声明且在作用域内
- **接口类型严格匹配**：对象字面量必须符合接口定义，不能添加未定义的属性
- **导入未使用变量清理**：及时删除未使用的导入和变量声明

### ESLint 格式化规范
- **多行对象/函数调用**：超过80字符的语句必须换行，每个参数/属性单独一行
- **字符串模板规范**：错误消息等长字符串使用多行格式
- **代码格式化**：所有代码必须通过 `npm run lint` 检查无错误

### 代码完成后的验证流程
1. **IDE诊断检查**：使用 `mcp__ide__getDiagnostics` 确保无 TypeScript 错误
2. **运行 lint 检查**：`npm run lint` 必须通过
3. **类型检查**：`npm run typecheck`（如果有）必须通过
4. **构建验证**：`npm run build` 必须成功

### 错误处理规范
- **HTTP 响应类型化**：API 响应使用明确的接口类型，不使用 any
- **错误状态处理**：所有网络请求必须包含完整的错误处理逻辑
- **变量命名一致性**：确保变量在整个文件中命名一致

### 提交前检查清单
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint 警告或错误
- [ ] 无未使用的导入和变量
- [ ] 所有类型定义明确，无 any 使用
- [ ] 代码格式符合项目规范

## Claude 编码注意事项

> **重要提醒**：以下是基于历史lint错误总结的编码规范，Claude在编写代码时必须严格遵守

### 🚫 绝对禁止的编码行为

#### 1. 滥用 any 类型
**❌ 错误做法**：
```typescript
// 绝对不要这样做
const [data, setData] = useState<any>([])
const handleResponse = (response: any) => {}
const items: any[] = []
```

**✅ 正确做法**：
```typescript
// 定义具体的接口类型
interface ApiResponse {
  data: ConversationItem[]
  status: number
}

const [data, setData] = useState<ConversationItem[]>([])
const handleResponse = (response: ApiResponse) => {}
const items: ConversationItem[] = []
```

#### 2. 忽略未使用变量
**❌ 错误做法**：
```typescript
// 不要保留未使用的变量
try {
  await apiCall()
} catch (e) {  // e 未使用会报错
  console.log('Error occurred')
}
```

**✅ 正确做法**：
```typescript
// 使用下划线前缀或移除未使用变量
try {
  await apiCall()
} catch (_error) {  // 明确标识未使用
  console.log('Error occurred')
}

// 或者完全移除
try {
  await apiCall()
} catch {
  console.log('Error occurred')  
}
```

#### 3. 空的 catch 块
**❌ 错误做法**：
```typescript
// 绝不要使用空的异常处理
try {
  loadData()
} catch {}  // 空catch块是危险的
```

**✅ 正确做法**：
```typescript
// 始终处理异常，即使是静默处理也要明确
try {
  loadData()
} catch (error) {
  console.error('加载数据失败:', error)
  // 或者
  // 静默处理，但要有注释说明原因
}
```

#### 4. React Hooks 依赖缺失
**❌ 错误做法**：
```typescript
// 使用了外部状态但未在依赖中声明
useEffect(() => {
  setCurrentKnowledgeBase(selectedId)  // setCurrentKnowledgeBase未在依赖中
}, [selectedId])  // 缺少setCurrentKnowledgeBase依赖
```

**✅ 正确做法**：
```typescript
// 包含所有依赖
useEffect(() => {
  setCurrentKnowledgeBase(selectedId)
}, [selectedId, setCurrentKnowledgeBase])

// 或者使用函数式更新避免依赖
useEffect(() => {
  if (selectedId) {
    setCurrentKnowledgeBase(selectedId)
  }
}, [selectedId])  // setter函数是稳定的，可以不加依赖
```

### 🎯 强制性编码规范

#### 1. 类型定义优先
```typescript
// 先定义接口，再使用
interface MessageItem {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

// 然后在组件中使用
const [messages, setMessages] = useState<MessageItem[]>([])
```

#### 2. API 响应类型化
```typescript
// 为所有API响应定义类型
interface ChatResponse {
  success: boolean
  data: {
    messageId: string
    content: string
  }
  error?: string
}

// 在API调用中使用
const response = await apiFetch<ChatResponse>('/api/chat', {
  method: 'POST',
  body: JSON.stringify(requestData)
})
```

#### 3. 事件处理器类型安全
```typescript
// 明确事件处理器的参数类型
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  // 处理逻辑
}

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value)
}
```

#### 4. 条件渲染类型安全
```typescript
// 确保条件渲染的类型安全
interface Props {
  user?: User  // 可选属性明确标记
}

// 在组件中安全使用
const UserProfile: React.FC<Props> = ({ user }) => {
  if (!user) {
    return <div>未登录</div>
  }
  
  return <div>{user.name}</div>  // 这里user肯定存在
}
```

### 📋 代码审查清单

每次编写组件时必须检查：

1. **类型安全**
   - [ ] 所有useState都有明确类型
   - [ ] 所有函数参数都有类型注解
   - [ ] API响应有对应的接口定义
   - [ ] 没有使用any类型

2. **React规范**
   - [ ] useEffect依赖数组完整
   - [ ] 没有在条件语句中调用Hooks
   - [ ] 组件Props有明确的接口定义
   - [ ] 事件处理器有正确的类型

3. **代码清洁**
   - [ ] 没有未使用的导入
   - [ ] 没有未使用的变量
   - [ ] 没有空的catch块
   - [ ] 错误处理完整

4. **性能考虑**
   - [ ] 避免在render中创建新对象
   - [ ] 合理使用useMemo和useCallback
   - [ ] 列表渲染有稳定的key

### 🔧 IDE配置建议

为了避免这些错误，建议配置以下IDE设置：

1. **启用严格的TypeScript检查**
2. **启用ESLint自动修复**
3. **配置保存时自动格式化**
4. **启用未使用导入的高亮提示**

### 💡 最佳实践总结

1. **类型优先思维**：先思考数据结构，再编写代码
2. **渐进式类型化**：从any开始，逐步完善为具体类型
3. **防御性编程**：始终处理错误情况和边界条件
4. **工具辅助**：充分利用TypeScript和ESLint的检查能力

> **特别注意**：这些规范不仅是为了通过lint检查，更是为了提高代码质量、可维护性和运行时安全性。每个规范都有其深层的技术原因。