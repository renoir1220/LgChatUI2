# CRM客户查询API文档

## 概述

CRM客户查询API提供了通过客户名称查询装机站点信息的功能，适用于外部服务（如Dify）集成调用。

## 认证方式

### 固定Token认证

为外部服务生成长期有效的JWT Token：

#### 生成固定Token
```bash
curl -X POST \
  "http://localhost:3000/api/auth/generate-fixed-token?username=刘冬阳&expiresIn=50y" \
  -H "Content-Type: application/json"
```

**响应示例**：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX-WImOWGrOmYsyIsInVzZXJuYW1lIjoi5YiY5Yas6ZizIiwidHlwZSI6ImV4dGVybmFsX3NlcnZpY2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI1LTA4LTMwVDEzOjMyOjM2LjY3MVoiLCJpYXQiOjE3NTY1NjA3NTYsImV4cCI6MzMzNDQ0MDc1Nn0.pbeIYdKi6bUF9WES65abs8p6nfQ7wYunnsw8XETYr98",
  "username": "刘冬阳",
  "type": "external_service",
  "expires_in": "50y",
  "generated_at": "2025-08-30T13:32:36.672Z",
  "usage": "Use this token in Authorization header: Bearer <token>"
}
```

**Token特点**：
- 有效期：50年（到2075年）
- 类型：external_service（外部服务专用）
- 适用于所有需要认证的API接口

## API接口

### 根据客户名称查询站点信息

#### 基本信息
- **接口路径**: `GET /api/crm-customer/sites-by-name/{customerName}`
- **功能**: 根据客户名称查询该客户的所有装机站点信息
- **数据库**: 使用CRM数据库
- **认证**: 需要Bearer Token认证

#### 请求参数
| 参数 | 类型 | 位置 | 必须 | 说明 |
|------|------|------|------|------|
| customerName | string | URL路径 | 是 | 客户名称（需要URL编码） |

#### 请求示例

**cURL调用**：
```bash
curl -X GET \
  "http://localhost:3000/api/crm-customer/sites-by-name/中山大学附属肿瘤医院" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX-WImOWGrOmYsyIsInVzZXJuYW1lIjoi5YiY5Yas6ZizIiwidHlwZSI6ImV4dGVybmFsX3NlcnZpY2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI1LTA4LTMwVDEzOjMyOjM2LjY3MVoiLCJpYXQiOjE3NTY1NjA3NTYsImV4cCI6MzMzNDQ0MDc1Nn0.pbeIYdKi6bUF9WES65abs8p6nfQ7wYunnsw8XETYr98" \
  -H "Content-Type: application/json"
```

**JavaScript调用**：
```javascript
const response = await fetch('http://localhost:3000/api/crm-customer/sites-by-name/中山大学附属肿瘤医院', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX-WImOWGrOmYsyIsInVzZXJuYW1lIjoi5YiY5Yas6ZizIiwidHlwZSI6ImV4dGVybmFsX3NlcnZpY2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI1LTA4LTMwVDEzOjMyOjM2LjY3MVoiLCJpYXQiOjE3NTY1NjA3NTYsImV4cCI6MzMzNDQ0MDc1Nn0.pbeIYdKi6bUF9WES65abs8p6nfQ7wYunnsw8XETYr98',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

#### 响应格式

**成功响应 (200)**：
```json
{
  "sites": [
    {
      "installId": "5AD9F8F2-A060-433A-BD34-4D1BF5D163C2",
      "installCode": "JK50239",
      "documentStatus": "已归档",
      "projectSummary": null,
      "productCategory": "病理软件",
      "productSubcategory": "PathQC系统",
      "siteName": "ebv,hbv分子病理导入接口",
      "completeDate": "2017-10-02T23:27:00.000Z",
      "acceptanceDate": null,
      "businessType": null,
      "quantity": 1
    },
    {
      "installId": "B49873BF-5196-4F52-AE08-ED46BA709809",
      "installCode": "JK50339",
      "documentStatus": "已归档", 
      "projectSummary": null,
      "productCategory": "病理接口",
      "productSubcategory": "信息接口",
      "siteName": "定制特检医嘱收费接口",
      "completeDate": "2018-05-21T17:00:00.000Z",
      "acceptanceDate": null,
      "businessType": null,
      "quantity": 1
    }
  ],
  "total": 109
}
```

**响应字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| sites | array | 站点信息列表 |
| sites[].installId | string | 装机ID |
| sites[].installCode | string | 装机编码 |
| sites[].documentStatus | string | 文档状态（如：已归档、已验收等） |
| sites[].projectSummary | string\|null | 项目摘要 |
| sites[].productCategory | string | 产品大类 |
| sites[].productSubcategory | string | 产品小类 |
| sites[].siteName | string | 站点名称 |
| sites[].completeDate | string\|null | 完成时间（ISO格式） |
| sites[].acceptanceDate | string\|null | 验收时间（ISO格式） |
| sites[].businessType | string\|null | 业务类型 |
| sites[].quantity | number | 数量 |
| total | number | 总记录数 |

#### 错误响应

**客户不存在 (401)**：
```json
{
  "statusCode": 401,
  "message": "用户 xxx 不存在",
  "error": "Unauthorized",
  "timestamp": "2025-08-30T20:24:44.374",
  "path": "/api/crm-customer/sites-by-name/xxx",
  "requestId": "c83c92dc-c1e6-4fd3-b642-5c2b9aec526b"
}
```

**参数错误 (400)**：
```json
{
  "statusCode": 400,
  "message": "客户名称不能为空",
  "error": "Bad Request"
}
```

**认证失败 (401)**：
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## 注意事项

### URL编码
中文客户名称必须进行URL编码：
- `中山大学附属肿瘤医院` → `%E4%B8%AD%E5%B1%B1%E5%A4%A7%E5%AD%A6%E9%99%84%E5%B1%9E%E8%82%BF%E7%98%A4%E5%8C%BB%E9%99%A2`

### 查询逻辑
API内部执行两步查询：
1. 根据客户名称查找客户ID
2. 使用客户ID查询站点信息

如果客户不存在，返回空数组而不是错误。

### 性能考虑
- 查询响应时间：500-1200ms（取决于数据量）
- 建议在外部服务中添加适当的缓存机制
- 大客户可能返回100+条记录

## 测试用例

### 已验证的测试客户
- 中山大学附属肿瘤医院（109条记录）
- 客户ID：6DA413CC-EC6E-42D7-BF88-AB2E83EBEAD2

### 测试命令
```bash
# 测试正常查询
curl -X GET \
  "http://localhost:3000/api/crm-customer/sites-by-name/中山大学附属肿瘤医院" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX-WImOWGrOmYsyIsInVzZXJuYW1lIjoi5YiY5Yas6ZizIiwidHlwZSI6ImV4dGVybmFsX3NlcnZpY2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI1LTA4LTMwVDEzOjMyOjM2LjY3MVoiLCJpYXQiOjE3NTY1NjA3NTYsImV4cCI6MzMzNDQ0MDc1Nn0.pbeIYdKi6bUF9WES65abs8p6nfQ7wYunnsw8XETYr98"

# 测试不存在的客户
curl -X GET \
  "http://localhost:3000/api/crm-customer/sites-by-name/不存在的客户" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX-WImOWGrOmYsyIsInVzZXJuYW1lIjoi5YiY5Yas6ZizIiwidHlwZSI6ImV4dGVybmFsX3NlcnZpY2UiLCJnZW5lcmF0ZWRfYXQiOiIyMDI1LTA4LTMwVDEzOjMyOjM2LjY3MVoiLCJpYXQiOjE3NTY1NjA3NTYsImV4cCI6MzMzNDQ0MDc1Nn0.pbeIYdKi6bUF9WES65abs8p6nfQ7wYunnsw8XETYr98"
```

## 版本信息

- **创建时间**: 2025-08-30
- **API版本**: v1.0
- **维护者**: 开发团队
- **更新频率**: 随CRM数据库结构变更而更新

---

**重要提醒**: 此API连接生产CRM数据库，请谨慎使用，避免频繁查询影响系统性能。