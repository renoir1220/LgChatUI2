# 聊天界面开发计划 (TODO.md)

本计划旨在基于 `LgChatUI2` 项目现有的 **Shadcn/UI** 和 **Tailwind CSS** 技术栈，分步开发一个功能完整的聊天界面。功能点主要参考 `LgChatUI` 项目。

---

### 第一阶段：核心UI组件开发

使用 Shadcn/UI 提供的基础组件，封装成我们的业务组件。

- [ ] **1. 消息气泡组件 (`components/MessageBubble.tsx`)**
  - **功能**: 用于展示单条消息，区分用户和助手。
  - **实现**:
    - 使用 `<Avatar>` 和 `<AvatarImage>` 显示用户或助手的头像。
    - 使用 `classnames` 或 `clsx` 结合 `role` 属性（`user` | `assistant`）来切换气泡的布局（`flex-row` vs `flex-row-reverse`）和颜色。
    - 使用 Tailwind CSS 的 `prose` 插件样式来渲染 Markdown 内容。
    - 预留底部操作区（如复制、重试按钮）的插槽。

- [ ] **2. 消息列表组件 (`components/MessageList.tsx`)**
  - **功能**: 渲染整个对话历史记录。
  - **实现**:
    - 使用 `<ScrollArea>` 创建一个可滚动的消息区域。
    - 循环渲染 `MessageBubble` 组件列表。
    - 实现一个在加载新消息时自动滚动到底部的 Hook (`useAutoScroll`)。
    - 实现加载中（"typing"）的占位符/动画效果。

- [ ] **3. 聊天输入区组件 (`components/ChatInput.tsx`)**
  - **功能**: 用户输入文字、发送消息、触发展示附件等。
  - **实现**:
    - 使用 `<Textarea>` 作为输入框，并实现高度自适应。
    - 使用 `<Button>` 作为发送按钮，并处理其 `loading` 状态（点击后禁用并显示加载图标）。
    - 使用 `<Button variant="ghost" size="icon">` 作为附件和快捷指令按钮。

- [ ] **4. 会话列表组件 (`components/ConversationList.tsx`)**
  - **功能**: 展示在侧边栏的所有历史会话。
  - **实现**:
    - 整体使用 `<Card>` 或简单的 `<div>` 作为容器。
    - 顶部放置一个 "新建会话" 的 `<Button>`。
    - 列表区域使用 `<ScrollArea>`。
    - 循环渲染每个会话项，可使用 `<Button variant="ghost">` 来实现，并处理 `active` 状态。
    - 使用 `<DropdownMenu>` 实现每个会话的“重命名”、“删除”等右键菜单操作。

- [ ] **5. 欢迎页组件 (`components/WelcomeScreen.tsx`)**
  - **功能**: 在新会话开始时展示欢迎信息和快捷指令。
  - **实现**:
    - 使用 `<Card>` 和 `<CardHeader>`, `<CardContent>`, `<CardFooter>` 组合布局。
    - 使用多个 `<Button variant="outline">` 渲染可点击的“热门话题”或功能介绍。

---

### 第二阶段：整体页面组装

- [ ] **1. 创建聊天页面 (`ChatPage.tsx`)**
  - **功能**: 整合所有UI组件，形成完整的聊天界面。
  - **实现**:
    - 使用 Shadcn/UI 的 `<ResizablePanelGroup>` 创建可调整的左右分栏布局。
    - **左侧面板**: 放置 `ConversationList` 组件。
    - **右侧面板**:
      - 顶部放置页面头部（知识库 `<Select>`、用户信息 `<DropdownMenu>`）。
      - 中间根据是否有消息，条件渲染 `MessageList` 或 `WelcomeScreen`。
      - 底部放置 `ChatInput` 组件。

---

### 第三阶段：状态管理与业务逻辑

- [ ] **1. 引入状态管理**
  - **技术选型**: 优先使用 React Hooks (`useState`, `useReducer`, `useContext`)。如果状态复杂，可考虑引入 `zustand`。
  - **核心状态**:
    - `messages`: `Message[]` - 当前消息列表。
    - `conversations`: `Conversation[]` - 历史会话列表。
    - `activeConversationId`: `string | null` - 当前会话ID。
    - `isLoading`: `boolean` - 请求加载状态。
    - `input`: `string` - 输入框内容。

- [ ] **2. 实现事件处理函数**
  - `handleSendMessage(message: string)`: 发送消息的逻辑。
  - `handleSelectConversation(id: string)`: 切换会话的逻辑。
  - `handleNewConversation()`: 新建会话的逻辑。
  - `handleDeleteConversation(id: string)`: 删除会话的逻辑。

---

### 第四阶段：API 对接

- [ ] **1. 对接会话接口**
  - `GET /api/conversations`: 在页面加载时获取会话列表。
  - `GET /api/conversations/:id`: 在切换会话时获取消息历史。
  - `DELETE /api/conversations/:id`: 在删除会话时调用。

- [ ] **2. 对接聊天接口 (`POST /api/chat`)**
  - **核心**: 实现流式响应处理逻辑。
  - 使用 `fetch` API 发起请求。
  - 使用 `ReadableStream` 和 `TextDecoder` 逐块读取和解码响应。
  - 在接收到数据流时，实时更新 `messages` 状态，实现打字机效果。
  - 实现请求中断逻辑 (`AbortController`)，允许用户停止生成。
  - 在UI上正确处理和显示请求错误。

- [ ] **3. (可选) 对接知识库接口**
  - `GET /api/knowledge-bases`: 获取知识库列表。
  - 在聊天页面头部实现一个 `<Select>` 组件用于切换知识库，并将所选 ID 随聊天请求发送。

---

### 第五阶段：Dify知识库引用功能

**重要功能补充**：基于原LgChatUI项目，实现Dify知识库的引用展示功能。

- [ ] **1. 知识库引用数据结构**
  - **CitationItem接口**: 定义引用项的数据结构。
    ```typescript
    interface CitationItem {
      source: string;           // 知识库来源
      content: string;          // 引用的文本内容
      document_name?: string;   // 文档名称
      score?: number;          // 相关性评分
      dataset_id?: string;     // 数据集ID
      document_id?: string;    // 文档ID
      segment_id?: string;     // 片段ID
      position?: number;       // 引用位置编号
    }
    ```

- [ ] **2. 引用标签组件 (`components/Citation.tsx`)**
  - **功能**: 展示单个知识库引用，点击查看详情。
  - **实现**:
    - 使用 `<Badge>` 或 `<Button variant="outline" size="sm">` 显示引用编号和文档名。
    - 使用 `<Dialog>` 或 `<Modal>` 展示引用详情（文档信息、原文内容、评分等）。
    - 支持复制引用原文功能。

- [ ] **3. 引用列表组件 (`components/CitationList.tsx`)**
  - **功能**: 在消息底部展示所有相关引用。
  - **实现**:
    - 按文档分组显示引用，相同文档的多个引用合并显示。
    - 使用不同颜色的 `<Badge>` 区分不同文档。
    - 支持点击展开查看具体引用内容。
    - 实现图片引用的lightbox查看功能。

- [ ] **4. 知识库选择器组件 (`components/KnowledgeBaseSelector.tsx`)**
  - **功能**: 在聊天页面头部选择知识库。
  - **实现**:
    - 使用 `<Select>` 组件展示可用知识库列表。
    - 支持加载状态和错误处理。
    - 将选择的知识库ID传递给聊天请求。

- [ ] **5. 引用内容处理**
  - **markdown渲染**: 支持引用内容中的markdown格式。
  - **图片支持**: 处理引用中包含的图片，实现预览和lightbox功能。
  - **文本截断**: 长文本智能截断并提供展开功能。

- [ ] **6. 集成到消息组件**
  - 在 `MessageBubble` 组件中集成 `CitationList`。
  - 处理Dify API返回的引用数据，转换为前端数据结构。
  - 实现引用数据的状态管理和缓存。

---

### 第六阶段：高级功能扩展（先不做）

- [ ] **1. 消息操作功能**
  - 消息复制、重新生成、点赞/点踩功能。
  - 消息编辑和删除功能。

- [ ] **2. 附件上传支持**
  - 图片上传和预览功能。
  - 文件上传和处理。

- [ ] **3. 会话管理增强**
  - 会话重命名功能。
  - 会话导出和分享功能。
  - 会话搜索和筛选。
