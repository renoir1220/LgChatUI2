# Requirements API 文档

## 概述

Requirements API 提供需求信息的查询和搜索功能，支持多关键词搜索和分页查询。

## 基础信息

**Base URL**: `http://your-domain:3000/api/requirements`

**认证**: 需要有效的JWT Token（通过Authorization header传递）

## API 端点

### 1. 根据客户名称查询需求列表

#### GET /api/requirements/by-customer

根据客户名称查询需求列表，支持分页。

**请求参数**：
- `customerName` (string, 必填): 客户名称
- `page` (number, 可选): 页码，默认为1
- `pageSize` (number, 可选): 每页数量，默认为10，最大100

**请求示例**：
```bash
GET /api/requirements/by-customer?customerName=北京大学第三医院&page=1&pageSize=20
```

**响应格式**：
```json
{
  "requirements": [
    {
      "requirementCode": "XQ_250707011",
      "siteName": "",
      "product": "区域病理送检平台",
      "requirementName": "区域送检平台支持外院条码",
      "currentStage": "现场更新",
      "content": "需求描述内容...",
      "requirementEvaluation": "先有接口文档再开发",
      "designContent": "设计方案...",
      "productDescription": "产品描述...",
      "developmentDescription": "开发说明...",
      "creator": "创建人",
      "customerName": "北京大学第三医院",
      "versionName": "V2.2.30(区域病理送检平台)",
      "createDate": "2025-07-07",
      "lastUpdateDate": "2025-08-18"
    }
  ],
  "total": 15
}
```

### 2. 多关键词搜索需求列表

#### GET /api/requirements/search

🆕 **新增功能** - 根据关键词搜索需求列表，支持多关键词组合查询。

**请求参数**：
- `keywords` (string, 必填): 搜索关键词，支持空格或逗号分割的多个关键词
- `page` (number, 可选): 页码，默认为1
- `pageSize` (number, 可选): 每页数量，默认为10，最大100

**搜索字段**：
搜索会在以下字段中进行匹配：
- `requirementName`: 需求名称
- `content`: 内容描述
- `requirementEvaluation`: 需求评估
- `designContent`: 设计内容
- `productDescription`: 产品描述
- `developmentDescription`: 开发描述

**搜索逻辑**：
- **多关键词 AND 关系**: 所有关键词都必须匹配
- **字段 OR 关系**: 每个关键词可以在任意搜索字段中出现
- **顺序无关**: 不限制关键词在字段中的出现顺序
- **模糊匹配**: 使用LIKE进行模糊匹配

**请求示例**：
```bash
# 单个关键词搜索
GET /api/requirements/search?keywords=医院

# 多关键词搜索（空格分割）
GET /api/requirements/search?keywords=医院 系统

# 多关键词搜索（逗号分割）
GET /api/requirements/search?keywords=医院,系统,升级

# 带分页的搜索
GET /api/requirements/search?keywords=平台 接口&page=2&pageSize=20
```

**响应格式**：
```json
{
  "requirements": [
    {
      "requirementCode": "XQ_250707011",
      "siteName": "",
      "product": "区域病理送检平台",
      "requirementName": "区域送检平台支持外院条码",
      "currentStage": "现场更新",
      "content": "需求描述内容...",
      "requirementEvaluation": "先有接口文档再开发",
      "designContent": "设计方案...",
      "productDescription": "产品描述...",
      "developmentDescription": "开发说明...",
      "creator": "创建人",
      "customerName": "客户名称",
      "versionName": "版本信息",
      "createDate": "2025-07-07",
      "lastUpdateDate": "2025-08-18"
    }
  ],
  "total": 35
}
```

### 3. 统计客户需求数量

#### GET /api/requirements/count-by-customer

查询指定客户的需求总数。

**请求参数**：
- `customerName` (string, 必填): 客户名称

**请求示例**：
```bash
GET /api/requirements/count-by-customer?customerName=北京大学第三医院
```

**响应格式**：
```json
{
  "total": 25
}
```

## 错误处理

### 错误响应格式

所有API错误都使用统一的响应格式：

```json
{
  "statusCode": 400,
  "message": "错误描述信息",
  "error": "详细错误信息",
  "timestamp": "2025-09-02T11:30:23.214Z",
  "path": "/api/requirements/search"
}
```

### 常见错误码

| 状态码 | 描述 | 常见原因 |
|--------|------|----------|
| 400 | 请求参数错误 | keywords为空、page/pageSize格式错误 |
| 401 | 未授权 | 缺少或无效的JWT Token |
| 500 | 服务器内部错误 | 数据库连接失败、查询超时 |

### 错误示例

**参数验证失败**：
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "至少需要一个有效的搜索关键词"
}
```

**服务器错误**：
```json
{
  "statusCode": 500,
  "message": "搜索需求列表失败",
  "error": "根据关键词搜索需求列表失败，请稍后重试"
}
```

## 使用建议

### 性能优化

1. **合理设置分页大小**: 建议pageSize设置为10-50，避免一次查询过多数据
2. **精确关键词**: 使用具体的关键词可以提高查询效率
3. **避免过于宽泛的搜索**: 单个字符的关键词可能返回大量结果

### 搜索技巧

1. **组合搜索**: 使用多个关键词可以获得更精确的结果
2. **关键词选择**: 选择需求中常见的技术术语、产品名称或功能描述
3. **客户名称搜索**: 如果知道具体客户，建议使用客户名称查询接口

## 更新日志

### v1.1.0 (2025-09-02)
- 🆕 新增多关键词搜索API (`/api/requirements/search`)
- ✨ 支持空格和逗号分割的多关键词查询
- 🔍 搜索覆盖6个核心字段
- 📖 完善API文档和使用示例

### v1.0.0 
- 📝 基础需求查询功能
- 👥 客户名称查询接口
- 📊 需求统计接口

## 联系方式

如有问题或建议，请联系开发团队。