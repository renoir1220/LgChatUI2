# 信息流 Feed API 调用说明

本文档说明如何从外部系统调用本项目的信息流（Feed）API 以插入、查询与互动。内容基于后端实现与根目录 `CLAUDE.md`/`backend/CLAUDE.md` 中的约定。

## 快速开始

开发环境默认后端基址为 `http://localhost:3000`。

1) 登录获取 JWT：

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "username": "your_name" }'
```

响应示例（节选）：

```json
{
  "access_token": "<JWT>",
  "user": { "id": 1, "username": "your_name", "roles": [] }
}
```

2) 使用 Token 创建 Feed：

```bash
curl -X POST http://localhost:3000/api/infofeed \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "标题",
    "content": "正文，支持 Markdown 图片！[](https://example.com/a.png)",
    "category": "news",
    "status": "published",
    "source": "manual"
  }'
```

成功时返回：

```json
{
  "success": true,
  "data": { /* 新建的 Feed 对象 */ },
  "message": "创建信息流成功"
}
```

## 鉴权

- 登录：`POST /api/auth/login`，请求体 `{ "username": "<你的用户名>" }`
- 调用受保护接口时在请求头加入：`Authorization: Bearer <JWT>`
- 受保护接口含创建、更新、删除、点赞、评论等（见下）

## 端点总览

- `GET /api/infofeed`：获取列表（公开）
- `GET /api/infofeed/:id`：获取详情（公开）
- `POST /api/infofeed`：创建信息流（需登录）
- `PUT /api/infofeed/:id`：更新信息流（需登录）
- `DELETE /api/infofeed/:id`：删除信息流（需登录）
- `POST /api/infofeed/:id/like`：点赞/取消点赞（需登录）
- `GET /api/infofeed/:id/comments`：获取评论列表（公开）
- `POST /api/infofeed/:id/comments`：添加评论（需登录）
- `POST /api/infofeed/comments/:comment_id/like`：评论点赞/取消（需登录）
- `POST /api/infofeed/comments/:comment_id/reply`：回复评论（需登录）

管理端（需管理员权限）：

- `POST /api/admin/news`：创建新闻（写入同一张表 `AI_InfoFeed`，默认草稿）
- `GET/PUT/DELETE /api/admin/news/*`：管理查询/编辑/删除/改状态/上传

## 创建 Feed 请求参数

路径：`POST /api/infofeed`

请求体（DTO 校验约束）：

```json
{
  "title": "string (1..200)",
  "content": "string (>=1)",
  "summary": "string (<=500, 可选)",
  "category": "all | related | news | features | knowledge",
  "thumbnail_url": "URL (可选)",
  "source": "manual | auto (默认 manual)",
  "is_pinned": "boolean (默认 false)",
  "status": "draft | published | archived (默认 published)",
  "publish_time": "ISO 日期时间字符串 (可选, 默认当前时间)"
}
```

行为与默认值：

- 若未提供 `thumbnail_url`，系统会尝试从 `content` 中自动提取首图作为缩略图（不一定持久化，仅用于展示或由后端在创建时填充）。
- `source` 默认 `manual`，`status` 默认 `published`，`is_pinned` 默认 `false`。
- `publish_time` 未提供时，取服务器当前时间。

## 常用示例

获取列表：

```bash
curl "http://localhost:3000/api/infofeed?category=news&page=1&limit=20&order_by=publish_time&order_direction=DESC"
```

获取详情：

```bash
curl http://localhost:3000/api/infofeed/123
```

更新 Feed：

```bash
curl -X PUT http://localhost:3000/api/infofeed/123 \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新标题",
    "summary": "新的摘要"
  }'
```

删除 Feed：

```bash
curl -X DELETE http://localhost:3000/api/infofeed/123 \
  -H "Authorization: Bearer <JWT>"
```

点赞/取消点赞：

```bash
curl -X POST http://localhost:3000/api/infofeed/123/like \
  -H "Authorization: Bearer <JWT>"
```

添加评论：

```bash
curl -X POST http://localhost:3000/api/infofeed/123/comments \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "content": "写的很好！" }'
```

回复评论：

```bash
curl -X POST http://localhost:3000/api/infofeed/comments/456/reply \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "content": "同感！" }'
```

## 返回格式与错误

所有信息流接口统一返回包装：

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "error": "可选，错误时返回"
}
```

常见错误：

- `401 Unauthorized`：缺少或无效的 JWT
- `400 Bad Request`：请求体验证未通过（字段缺失或格式不合法）
- `404 Not Found`：资源不存在
- `500 Internal Server Error`：服务器错误

## 外部系统集成建议

- 推荐“服务账号 + JWT”方式：外部系统使用一个固定的用户名登录获取 JWT，再调用受保护接口。
- 若需免登录的推送（Webhook/API Key），可在后端新增一个带 API Key 校验的专用端点（不在当前默认实现中）。如需此能力，请在需求中说明 Key 的传递方式（请求头/查询串）与调用频率限制。

## 枚举参考

- 分类（`category`）：`all` | `related` | `news` | `features` | `knowledge`
- 来源（`source`）：`manual` | `auto`
- 状态（`status`）：`draft` | `published` | `archived`

---

附：更多架构与约定请参考根目录 `CLAUDE.md` 与 `backend/CLAUDE.md`。

