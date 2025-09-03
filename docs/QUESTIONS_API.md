# Questions API 文档

## 概述

Questions API 提供常见问题的多关键词搜索功能，支持在问题描述、原因分析、解决方法和备注等字段中进行模糊匹配查询。

## 基础信息

**Base URL**: `http://your-domain:3000/api/questions`

**认证**: 需要有效的JWT Token（通过Authorization header传递）

## API 端点

### 多关键词搜索常见问题列表

#### GET /api/questions/search

🆕 **新增功能** - 根据关键词搜索常见问题列表，支持多关键词组合查询。

**请求参数**：
- `keywords` (string, 必填): 搜索关键词，支持空格或逗号分割的多个关键词
- `page` (number, 可选): 页码，默认为1
- `pageSize` (number, 可选): 每页数量，默认为10，最大100

**搜索字段**：
搜索会在以下字段中进行匹配：
- `description`: 问题描述
- `reason`: 原因分析
- `resolvent`: 解决方法
- `remark`: 备注

**搜索逻辑**：
- **多关键词 AND 关系**: 所有关键词都必须匹配
- **字段 OR 关系**: 每个关键词可以在任意搜索字段中出现
- **顺序无关**: 不限制关键词在字段中的出现顺序
- **模糊匹配**: 使用LIKE进行模糊匹配

**请求示例**：
```bash
# 单个关键词搜索
GET /api/questions/search?keywords=报错

# 多关键词搜索（空格分割）
GET /api/questions/search?keywords=QP 报错

# 多关键词搜索（逗号分割）
GET /api/questions/search?keywords=医嘱,确认,病理

# 带分页的搜索
GET /api/questions/search?keywords=系统 配置&page=2&pageSize=20
```

**响应格式**：
```json
{
  "questions": [
    {
      "questionId": "6db70a2f-9bb0-4c7c-8df8-82e738f64e81",
      "customerName": "上海朗珈软件有限公司",
      "siteName": "QP切片工作站",
      "productType": "PATHQC",
      "module": "",
      "description": "QP报错：所要确认的医嘱类型，不能进行医嘱确认!病理号:TEST00106---特殊染色\n开关在哪",
      "createUser": "WWY",
      "createTime": "2024-10-17",
      "resolvent": "2，技术特检页，执行时判断特检医嘱类型.（中山一院）\n[qp]\ntjyzzxpdyzlx=1\ntjyzzxpdyzlxlb=免疫组化,特殊染色",
      "reason": "",
      "status": "3",
      "remark": "",
      "repairUserName": "王学飞",
      "repairDate": "2024-10-16",
      "supportUserName": "章皖栋",
      "handleDate": null,
      "phrUserName": ""
    }
  ],
  "total": 2
}
```

**返回字段说明**：
- `questionId`: 问题唯一标识符
- `customerName`: 客户名称
- `siteName`: 站点名称
- `productType`: 产品类型
- `module`: 模块名称
- `description`: 问题描述
- `createUser`: 创建用户
- `createTime`: 创建时间
- `resolvent`: 解决方法
- `reason`: 原因分析
- `status`: 状态
- `remark`: 备注
- `repairUserName`: 维修负责人
- `repairDate`: 维修日期
- `supportUserName`: 技术支持人员
- `handleDate`: 处理日期
- `phrUserName`: PHR用户名

## 错误处理

### 错误响应格式

所有API错误都使用统一的响应格式：

```json
{
  "statusCode": 400,
  "message": "错误描述信息",
  "error": "详细错误信息",
  "timestamp": "2025-09-02T14:15:44.458Z",
  "path": "/api/questions/search"
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
  "message": "搜索常见问题列表失败",
  "error": "根据关键词搜索常见问题列表失败，请稍后重试"
}
```

## 使用建议

### 性能优化

1. **合理设置分页大小**: 建议pageSize设置为10-50，避免一次查询过多数据
2. **精确关键词**: 使用具体的关键词可以提高查询效率
3. **避免过于宽泛的搜索**: 单个字符的关键词可能返回大量结果

### 搜索技巧

1. **组合搜索**: 使用多个关键词可以获得更精确的结果
   - 例如: `QP 报错` 比单独搜索 `QP` 或 `报错` 更精确
2. **关键词选择**: 选择常见问题中的关键技术术语、错误信息或产品名称
3. **错误信息搜索**: 直接搜索错误提示的关键部分通常能快速定位问题
4. **产品模块搜索**: 结合产品名称和模块名称可以缩小搜索范围

### 实际应用场景

1. **技术支持**: 根据用户反馈的错误信息快速查找解决方案
2. **知识库检索**: 在问题描述、原因分析和解决方法中查找相关内容
3. **问题分类**: 通过关键词搜索同类型问题进行统计分析
4. **历史问题查询**: 查找类似的历史问题和解决方案

## 更新日志

### v1.0.0 (2025-09-02)
- 🆕 新增多关键词搜索常见问题API (`/api/questions/search`)
- ✨ 支持空格和逗号分割的多关键词查询
- 🔍 搜索覆盖4个核心字段：问题描述、原因分析、解决方法、备注
- 📊 支持分页查询和总数统计
- 📖 完整的API文档和使用示例

## 联系方式

如有问题或建议，请联系开发团队。