# LgChatUI Database Schema

此文档记录了LgChatUI项目中使用的MSSQL数据库表结构。所有AI相关表以 `AI_` 开头。

## 核心表结构

### AI_CONVERSATIONS (会话表)
聊天会话的基本信息存储

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| CONVERSATION_ID | varchar(50) | 会话唯一ID (GUID字符串) | PRIMARY KEY |
| USER_ID | varchar | 用户ID | NOT NULL |
| TITLE | nvarchar | 会话标题 | |
| KNOWLEDGE_BASE_ID | int | 关联知识库ID | FK |
| DIFY_CONVERSATION_ID | varchar | Dify平台会话ID | |
| CREATED_AT | datetime | 创建时间 | DEFAULT GETDATE() |
| UPDATED_AT | datetime | 更新时间 | |

### AI_MESSAGES (消息表)
聊天消息记录

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| MESSAGE_ID | varchar(50) | 消息唯一ID (GUID字符串) | PRIMARY KEY |
| CONVERSATION_ID | varchar(50) | 所属会话ID (GUID字符串) | FK, NOT NULL |
| ROLE | varchar(20) | 消息角色(USER/ASSISTANT) | NOT NULL |
| CONTENT | ntext | 消息内容 | |
| CLIENT_TYPE | varchar(20) | 客户端类型(mobile/desktop/tablet/unknown) | ✅ 已添加 |
| CLIENT_PLATFORM | varchar(50) | 操作系统平台(Windows/macOS/Linux/iOS/Android/unknown) | ✅ 已添加 |
| CLIENT_BROWSER | varchar(50) | 浏览器类型(Chrome/Safari/Firefox/Edge/unknown) | ✅ 已添加 |
| USER_AGENT | varchar(500) | 完整User-Agent字符串 | ✅ 已添加 |
| CREATED_AT | datetime | 创建时间 | DEFAULT GETDATE() |
| UPDATED_AT | datetime | 更新时间 | |

### AI_MESSAGE_FEEDBACK (消息反馈表)
用户对AI回复的反馈

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| FEEDBACK_ID | varchar(50) | 反馈唯一ID (GUID字符串) | PRIMARY KEY |
| MESSAGE_ID | varchar(50) | 关联消息ID (GUID字符串) | FK, NOT NULL |
| USER_ID | varchar | 用户ID | NOT NULL |
| CONVERSATION_ID | varchar(50) | 关联会话ID (GUID字符串) | FK |
| FEEDBACK_TYPE | varchar(50) | 反馈类型(helpful/not_helpful/partially_helpful) | |
| RATING | int | 评分 | |
| FEEDBACK_TEXT | ntext | 反馈文本 | |
| FEEDBACK_TAGS | varchar(500) | 反馈标签 | |
| CREATED_AT | datetime | 创建时间 | DEFAULT GETDATE() |
| UPDATED_AT | datetime | 更新时间 | |
| IS_DELETED | bit | 是否删除 | DEFAULT 0 |

### AI_KNOWLEDGE_BASES (知识库表)
AI知识库配置

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| ID | int | 自增主键 | PRIMARY KEY, IDENTITY |
| KB_KEY | varchar(100) | 知识库键值 | UNIQUE |
| NAME | nvarchar(200) | 知识库名称 | NOT NULL |
| DESCRIPTION | ntext | 描述 | |
| API_KEY | varchar(500) | API密钥 | |
| API_URL | varchar(500) | API地址 | |
| AVAILABLE_USERS | ntext | 可用用户列表 | |
| CAN_SELECT_MODEL | bit | 是否可选择模型 | DEFAULT 0 |
| ENABLED | bit | 是否启用 | DEFAULT 1 |
| SORT_ORDER | int | 排序序号 | DEFAULT 0 |
| CREATED_AT | datetime | 创建时间 | DEFAULT GETDATE() |
| UPDATED_AT | datetime | 更新时间 | |

### AI_MODEL (模型表)
AI模型配置

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| ID | int | 自增主键 | PRIMARY KEY, IDENTITY |
| PROVIDER | varchar(100) | 提供商 | |
| MODEL_NAME | varchar(200) | 模型名称 | |
| AVAILABLE_USERS | ntext | 可用用户列表 | |
| ENABLED | bit | 是否启用 | DEFAULT 1 |
| IS_DEFAULT | bit | 是否默认 | DEFAULT 0 |

## 业务功能表

### AI_SUGGESTIONS (建议表)
用户建议管理

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| SUGGESTION_ID | varchar(50) | 建议唯一ID (GUID字符串) | PRIMARY KEY |
| SUBMITTER_NAME | nvarchar(100) | 提交者姓名 | |
| TITLE | nvarchar(200) | 建议标题 | NOT NULL |
| CONTENT | ntext | 建议内容 | |
| CONTACT_INFO | nvarchar(200) | 联系方式 | |
| STATUS | varchar(20) | 状态 | DEFAULT 'pending' |
| DEVELOPER_REPLY | ntext | 开发者回复 | |
| PRIORITY | varchar(10) | 优先级 | DEFAULT 'medium' |
| CATEGORY | varchar(50) | 分类 | |
| CREATED_AT | datetime | 创建时间 | DEFAULT GETDATE() |
| UPDATED_AT | datetime | 更新时间 | |

### AI_InfoFeed (信息流表)
社交媒体式信息流

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | int | 自增主键 | PRIMARY KEY, IDENTITY |
| title | nvarchar(500) | 标题 | NOT NULL |
| content | ntext | 内容 | |
| summary | ntext | 摘要 | |
| category | varchar(50) | 分类 | |
| thumbnail_url | varchar(1000) | 缩略图URL | |
| source | varchar(100) | 来源 | |
| author_id | varchar(100) | 作者ID | |
| view_count | int | 浏览数 | DEFAULT 0 |
| like_count | int | 点赞数 | DEFAULT 0 |
| is_pinned | bit | 是否置顶 | DEFAULT 0 |
| status | varchar(20) | 状态 | DEFAULT 'draft' |
| publish_time | datetime | 发布时间 | |
| created_at | datetime | 创建时间 | DEFAULT GETDATE() |
| updated_at | datetime | 更新时间 | |

### AI_InfoFeedComment (信息流评论表)
信息流评论系统

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | int | 自增主键 | PRIMARY KEY, IDENTITY |
| feed_id | int | 关联信息流ID | FK, NOT NULL |
| user_id | varchar(100) | 用户ID | NOT NULL |
| parent_id | int | 父评论ID | FK |
| content | ntext | 评论内容 | NOT NULL |
| like_count | int | 点赞数 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT GETDATE() |
| updated_at | datetime | 更新时间 | |

### AI_InfoFeedLike (信息流点赞表)
信息流和评论点赞记录

| 列名 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | int | 自增主键 | PRIMARY KEY, IDENTITY |
| feed_id | int | 关联信息流ID | FK |
| comment_id | int | 关联评论ID | FK |
| user_id | varchar(100) | 用户ID | NOT NULL |
| created_at | datetime | 创建时间 | DEFAULT GETDATE() |

## 外键关系

```sql
-- 会话与消息
AI_MESSAGES.CONVERSATION_ID → AI_CONVERSATIONS.CONVERSATION_ID

-- 消息反馈
AI_MESSAGE_FEEDBACK.MESSAGE_ID → AI_MESSAGES.MESSAGE_ID
AI_MESSAGE_FEEDBACK.CONVERSATION_ID → AI_CONVERSATIONS.CONVERSATION_ID

-- 知识库关联
AI_CONVERSATIONS.KNOWLEDGE_BASE_ID → AI_KNOWLEDGE_BASES.ID

-- 信息流关联
AI_InfoFeedComment.feed_id → AI_InfoFeed.id
AI_InfoFeedComment.parent_id → AI_InfoFeedComment.id
AI_InfoFeedLike.feed_id → AI_InfoFeed.id
AI_InfoFeedLike.comment_id → AI_InfoFeedComment.id
```

## 索引建议

### 性能关键索引
- `AI_CONVERSATIONS.USER_ID` - 用户会话查询
- `AI_MESSAGES.CONVERSATION_ID` - 会话消息查询
- `AI_MESSAGE_FEEDBACK.MESSAGE_ID` - 消息反馈查询
- `AI_InfoFeed.status, AI_InfoFeed.publish_time` - 信息流发布查询

### 时间范围查询索引
- `AI_CONVERSATIONS.CREATED_AT` - 会话时间查询
- `AI_MESSAGES.CREATED_AT` - 消息时间查询
- `AI_InfoFeed.created_at` - 信息流时间查询

## 注意事项

1. **主键类型**: **重要**：所有GUID主键统一使用 `varchar(50)` 类型存储GUID字符串，不使用 `uniqueidentifier` 类型
2. **GUID格式**: GUID存储为标准格式字符串（如: '12345678-1234-1234-1234-123456789abc'）
3. **时间戳**: 所有表都包含 `CREATED_AT` 和可选的 `UPDATED_AT` 字段
4. **软删除**: 部分表如 `AI_MESSAGE_FEEDBACK` 使用 `IS_DELETED` 字段实现软删除
5. **编码**: 使用 `nvarchar` 和 `ntext` 支持Unicode字符
6. **大小写**: 所有列名使用大写约定，查询时必须使用正确的大小写
7. **类型安全**: 避免使用 `uniqueidentifier` 类型以防止类型转换错误

## 查询示例

### 获取用户会话列表
```sql
SELECT
    CONVERSATION_ID as id,
    TITLE as title,
    USER_ID as userId,
    CREATED_AT as createdAt
FROM AI_CONVERSATIONS
WHERE USER_ID = @p0
ORDER BY CREATED_AT DESC
```

### 获取会话消息
```sql
SELECT
    MESSAGE_ID as id,
    ROLE as role,
    CONTENT as content,
    CREATED_AT as createdAt
FROM AI_MESSAGES
WHERE CONVERSATION_ID = @p0
ORDER BY CREATED_AT ASC
```

### 获取消息反馈
```sql
SELECT
    FEEDBACK_TYPE as feedbackType,
    RATING as rating,
    FEEDBACK_TEXT as comment
FROM AI_MESSAGE_FEEDBACK
WHERE MESSAGE_ID = @p0 AND IS_DELETED = 0
```

### GUID生成示例
```sql
-- 创建新会话
DECLARE @newId varchar(50) = LOWER(CONVERT(varchar(36), NEWID()));
INSERT INTO AI_CONVERSATIONS (CONVERSATION_ID, USER_ID, TITLE, CREATED_AT)
VALUES (@newId, @p0, @p1, GETDATE());
```