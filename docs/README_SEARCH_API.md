# README Search API 文档

## 概述

README Search API 提供基于关键词的README配置信息搜索功能，主要用于查询系统配置、参数设置和功能说明等技术文档信息。该API支持多关键词搜索，并提供智能结果过滤和长度控制功能。

## 基础信息

**Base URL**: `http://your-domain:3000/api/readme-search`

**认证**: 需要有效的JWT Token（通过Authorization header传递）

## API 端点

### 搜索README配置信息

#### GET /api/readme-search

🔍 **核心功能** - 根据关键词搜索README配置信息，支持多关键词组合查询。

**请求参数**：
- `keywords` (string, 必填): 搜索关键词，支持逗号分割的多个关键词，最多10个关键词
- 每个关键词长度限制: 1-50个字符

**搜索字段**：
搜索会在以下字段中进行匹配：
- `FUNCTION1`: 功能说明（主要搜索字段）
- 返回信息包含: 站点名称、模块名称、参数配置、版本信息、用户信息、SQL语句

**搜索逻辑**：
- **多关键词 AND 关系**: 所有关键词都必须匹配
- **智能过滤**: 当结果过大时，自动过滤为只显示有开关配置的记录
- **长度控制**: 单次查询结果限制在10,000字符以内
- **排序规则**: 按创建时间和序号倒序排列

**请求示例**：
```bash
# 单个关键词搜索
GET /api/readme-search?keywords=切片

# 多关键词搜索
GET /api/readme-search?keywords=切片,列表

# 多关键词搜索（具体功能）
GET /api/readme-search?keywords=报告,打印,设置
```

**响应格式**：
```json
{
  "success": true,
  "data": "## 说明:切片工作站列表显示设置\n站点名称:QP切片工作站\n模块名称:切片管理\n参数:[qp]\ncpgzzlbxssz=1\n版本:2.5 - 2024-08-15 10:30:00\n用户:北京大学第三医院\nSQL:SELECT * FROM SLICE_LIST WHERE STATUS=1\n\n==================================================\n\n## 说明:切片状态管理配置\n...",
  "message": "找到 15 条相关配置信息"
}
```

**返回字段说明**：
- `success`: 操作是否成功
- `data`: 格式化的README配置信息，包含：
  - **说明**: 功能描述
  - **站点名称**: 适用的站点类型
  - **模块名称**: 所属功能模块
  - **参数**: 配置参数和开关设置
  - **版本**: 版本号和更新时间
  - **用户**: 相关用户或医院信息
  - **SQL**: 相关SQL语句（如有）
- `message`: 搜索结果统计信息

#### POST /api/readme-search

📝 **兼容接口** - 支持POST方式搜索，兼容不同HTTP客户端。

**请求体**：
```json
{
  "keywords": "切片,列表"
}
```

**支持的参数名**：
- `keywords`: 标准参数名
- `query`: 兼容参数名
- `search`: 兼容参数名

**响应格式**: 与GET接口完全相同

### 获取搜索建议

#### GET /api/readme-search/suggestions

💡 **辅助功能** - 获取常用搜索关键词建议，帮助用户快速定位需要的配置信息。

**请求示例**：
```bash
GET /api/readme-search/suggestions
```

**响应格式**：
```json
{
  "success": true,
  "data": [
    "切片",
    "报告",
    "列表",
    "打印",
    "查询",
    "登记",
    "工作站",
    "状态",
    "设置",
    "导出"
  ],
  "message": "获取搜索建议成功"
}
```

## 错误处理

### 错误响应格式

所有API错误都使用统一的响应格式：

```json
{
  "statusCode": 400,
  "message": "错误描述信息",
  "error": "Bad Request",
  "timestamp": "2025-09-02T14:15:44.458Z",
  "path": "/api/readme-search"
}
```

### 常见错误码

| 状态码 | 描述 | 常见原因 |
|--------|------|----------|
| 400 | 请求参数错误 | keywords为空、关键词过多或过长 |
| 401 | 未授权 | 缺少或无效的JWT Token |
| 500 | 服务器内部错误 | 数据库连接失败、查询超时 |

### 错误示例

**参数验证失败**：
```json
{
  "statusCode": 400,
  "message": "请提供keywords参数，例如: ?keywords=切片,列表"
}
```

**关键词数量超限**：
```json
{
  "statusCode": 400,
  "message": "搜索关键词数量不能超过10个"
}
```

**关键词长度超限**：
```json
{
  "statusCode": 400,
  "message": "单个关键词长度不能超过50个字符"
}
```

## 智能功能特性

### 📊 自适应结果过滤

当搜索结果过多（超过10,000字符）时，API会自动执行二次过滤：

1. **首次查询**: 返回所有匹配的配置信息
2. **智能过滤**: 如果结果过大，自动过滤为只显示有具体参数配置的记录
3. **友好提示**: 在结果中说明过滤情况和原始匹配数量

**过滤示例响应**：
```json
{
  "success": true,
  "data": "...配置信息...\n\n**注意**: 由于结果较多，已自动过滤为只显示有开关配置的 25 条记录（原始匹配 156 条）。",
  "message": "找到 25 条相关配置信息"
}
```

### 🔍 搜索优化建议

1. **使用具体关键词**: 使用"切片列表"比"列表"更精确
2. **组合搜索**: 结合功能和模块名称，如"报告,打印"
3. **避免过于宽泛**: 单字符关键词可能返回过多结果
4. **参考搜索建议**: 使用`/suggestions`端点获取推荐关键词

## 使用建议

### 性能优化

1. **关键词选择**: 使用具体的技术术语和功能名称
2. **组合策略**: 2-3个关键词的组合通常效果最佳
3. **缓存利用**: 相同查询在短时间内会利用数据库查询优化

### 实际应用场景

1. **技术支持**: 快速查找特定功能的配置方法
2. **系统集成**: 查询接口参数和SQL语句
3. **版本管理**: 了解功能的版本历史和更新情况
4. **问题排查**: 根据功能描述定位相关配置
5. **AI助手集成**: 为Dify等AI平台提供技术文档检索

### 搜索技巧

1. **功能导向**: 直接搜索功能名称，如"切片工作站"
2. **参数查找**: 搜索具体参数名或配置项
3. **模块定位**: 使用模块名称缩小搜索范围
4. **版本筛选**: 结合版本信息查找特定版本的配置

## 集成示例

### JavaScript 调用示例

```javascript
// 搜索README配置
async function searchReadmeConfig(keywords) {
  const response = await fetch(`/api/readme-search?keywords=${encodeURIComponent(keywords)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`搜索失败: ${response.status}`);
  }
  
  return await response.json();
}

// 获取搜索建议
async function getSearchSuggestions() {
  const response = await fetch('/api/readme-search/suggestions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
}

// 使用示例
try {
  const result = await searchReadmeConfig('切片,列表');
  console.log('搜索结果:', result.data);
  console.log('统计信息:', result.message);
} catch (error) {
  console.error('搜索失败:', error.message);
}
```

### cURL 调用示例

```bash
# 获取JWT Token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}' \
  | jq -r '.access_token')

# 搜索README配置
curl -X GET "http://localhost:3000/api/readme-search?keywords=切片,列表" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# 获取搜索建议
curl -X GET "http://localhost:3000/api/readme-search/suggestions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# POST方式搜索
curl -X POST "http://localhost:3000/api/readme-search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords": "报告,打印"}'
```

## 更新日志

### v1.0.0 (2025-09-02)
- 🆕 新增README配置信息搜索API (`/api/readme-search`)
- ✨ 支持多关键词组合搜索和智能结果过滤
- 🔍 提供搜索建议功能 (`/api/readme-search/suggestions`)
- 📊 智能长度控制和自适应过滤机制
- 🛡️ 完整的参数验证和错误处理
- 🚀 支持GET和POST两种调用方式
- 📖 完整的API文档和集成示例

## 联系方式

如有问题或建议，请联系开发团队。

---
**文档版本**: 1.0.0  
**最后更新**: 2025-09-02  
**API版本**: v1