# Release v0.4.0

**发布时间**: 2025-08-20

## 变更内容

- 667c062 style: 代码格式化
- 1e5813b feat(release): 实现完整的Docker部署和release功能

# Release v0.3.0

**发布时间**: 2025-08-20

## 变更内容

- 35512ce feat: Add unified build, deploy, health check, and version management scripts
- 5f708b8 feat(frontend/chat): 增加输入框聚焦到末尾的功能与快捷操作按钮
- 10a4a22 feat(frontend/chat): 添加欢迎页模式与玻璃质感支持\n\n- 在 ChatInput 和 ChatScreenRefactored 组件中引入 glass 属性，增强视觉效果\n- 实现欢迎页模式下的自然过渡背景与样式调整\n- 优化聊天标题栏在新对话时的显示逻辑
- a0cbaa3 fix(frontend/chat): 欢迎页用户名不再使用默认值\n\n- 若未获取到登录用户名，仅显示问候语，不再追加占位名\n- 渲染形式：{问候}{，用户名?}，避免误导性默认值
- 022402e feat(frontend/chat): 优化聊天欢迎页为登录页同款渐变风格\n\n- 替换模板默认 Welcome/Prompts 为简洁优雅的渐变背景\n- 使用与登录页一致的蓝色渐变文案，显示：你好：<用户名>\n- 去除无用图标与配置，避免无意义内容干扰\n- 无消息且为真实会话加载中时展示中心加载态，避免闪烁
- f10b49e feat(frontend/chat): 切换会话时立即清空消息并显示等待态\n\n- useConversations.switchConversation 先清空消息，再加载历史，用户获得即时反馈\n- 与 ChatScreenRefactored 的 messagesLoading 配合，切换后立即展示加载中而非旧消息或欢迎页
- 0a4c607 feat(frontend/chat): 首次进入默认停留在新对话，带会话ID刷新时避免欢迎界面闪烁\n\n- useChatState 支持初始会话ID，默认 'new'，不再自动选中历史第一条\n- ChatScreenRefactored 基于 URL 参数  初始化会话，切换/新建/首次发消息同步 URL\n- 刷新时如有会话ID：直接按该会话上下文加载消息，消息未就绪前显示居中加载，不再闪烁欢迎页\n- ChatMessageList 新增 showWelcome/messagesLoading 控制欢迎页与加载态\n- refreshConversations 仅刷新列表，不切换当前会话
- 23b930c 优化错误处理，添加API错误提示功能
- d926f05 优化客户字典选择处理，自动发送查询消息并改进知识库更新逻辑
- d428b0a 修复会话知识库保存功能并优化页面流畅度
- ad9c86c 修复路径转换中重复路径前缀的问题
- 0797df8 实现需求文本内容的路径转换功能
- c389fb5 优化需求消息组件UI和功能
- e9fed5e 优化需求消息组件宽度显示，实现与普通消息一致的布局效果
- af1e3f8 优化需求组件屏幕宽度利用率
- cd7b7a0 优化需求消息组件：使用Ant Design风格，提升屏幕利用率
- ae8bda7 实现需求展示专用消息组件
- 5bff171 claude挂了，用code继续，临时提交
- 4b167c9 feat: Add comprehensive deployment documentation for LgChatUI2
- 406e879 Implement code changes to enhance functionality and improve performance
- 7a70d7b 新增需求单共享类型定义，支持完整的业务数据模型
- 4d99b36 实现客户字典选择器功能，集成需求进展查询
- e70f7dd 实现客户字典查询API
- e69ad96 添加功能菜单和快捷操作处理，优化ChatInput和ChatScreen组件
- 33ef8d4 重构ChatInput组件，优化输入区域和功能按钮布局，添加附件上传功能

