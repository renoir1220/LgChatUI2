# AI消息操作按钮功能使用指南

## 功能概述

AI消息操作按钮功能允许在AI回答中嵌入可交互的按钮，用户点击后可执行各种操作，如页面跳转、数据导出、查看详情等。

## 按钮代码格式

### 基本语法
```
[BUTTON:按钮名称|命令|参数1=值1&参数2=值2]
```

### 参数说明
- **按钮名称**: 在页面上显示的按钮文本
- **命令**: 要执行的操作命令
- **参数**: 传递给命令的参数，使用URL查询参数格式

## 使用示例

### 1. 基本站点查询跳转
当AI回答包含站点统计信息时，在回答末尾添加：
```
无锡市人民医院目前有12个RPT站点，分布在不同的科室和楼层。

[BUTTON:查看详情|navigate_customer_sites|customerName=无锡市人民医院]
```

### 2. 多个操作按钮
可以在同一条消息中添加多个按钮：
```
北京大学第三医院的站点分析如下：
- RPT站点：15个
- MRI站点：8个
- CT站点：12个

[BUTTON:查看详情|navigate_customer_sites|customerName=北京大学第三医院]
[BUTTON:导出数据|export_customer_sites|customerName=北京大学第三医院&format=excel]
[BUTTON:添加站点|navigate_add_site|customerName=北京大学第三医院&type=rpt]
```

### 3. 通用页面跳转
```
相关信息可以在后台管理系统中查看。

[BUTTON:打开后台|navigate|url=/admin/dashboard&newTab=true]
```

## 可用命令列表

### 页面跳转命令

#### navigate_customer_sites
跳转到客户信息页面的站点汇总子页面
- **参数**:
  - `customerName` (必需): 客户名称
- **实际跳转**: `/customer?customerName={客户名}&defaultTab=sites&defaultSubTab=summary`

#### navigate_customer_detail  
跳转到客户信息页面的动态详情页面
- **参数**:
  - `customerName` (必需): 客户名称
- **实际跳转**: `/customer?customerName={客户名}&defaultTab=dynamic`

#### navigate_add_site
跳转到添加站点页面
- **参数**:
  - `customerName` (必需): 客户名称
  - `type` (可选): 站点类型（如 rpt, mri, ct）

#### navigate
通用页面跳转
- **参数**:
  - `url` (必需): 目标URL
  - `newTab` (可选): 是否在新标签页打开，默认 true

### 数据操作命令

#### export_customer_sites
导出客户站点数据
- **参数**:
  - `customerName` (必需): 客户名称
  - `format` (可选): 导出格式，默认 excel

#### copy_text
复制文本到剪贴板
- **参数**:
  - `text` (必需): 要复制的文本

### 界面操作命令

#### show_message
显示提示消息
- **参数**:
  - `text` (必需): 提示文本
  - `type` (可选): 消息类型（success, info, warning, error），默认 info

## 技术实现

### 前端组件结构
```
frontend/src/features/shared/
├── utils/
│   └── actionButtonParser.ts     # 按钮代码解析器
├── services/
│   └── actionCommandHandler.ts   # 命令处理器
├── components/
│   └── ActionButtons.tsx         # 按钮渲染组件
└── utils/
    └── markdown.tsx              # 集成到markdown渲染器
```

### 核心文件说明

#### actionButtonParser.ts
负责解析AI回答中的按钮代码，提供以下功能：
- `parseActionButtons()`: 解析按钮代码为结构化数据
- `removeButtonCodes()`: 从消息中移除按钮代码
- `hasActionButtons()`: 检查消息是否包含按钮

#### actionCommandHandler.ts
处理按钮点击时的命令执行：
- `executeCommand()`: 执行指定命令
- `registerCommandHandler()`: 注册新的命令处理器
- 内置多种常用命令处理器

#### ActionButtons.tsx
渲染按钮组件：
- 自动根据命令类型选择合适的图标
- 支持不同的按钮样式变体
- 响应式布局设计

## 按钮样式

### 自动样式选择
系统会根据命令类型自动选择合适的按钮样式：
- **主要操作** (`navigate_customer_*`, `export_*`): 默认样式（蓝色背景）
- **次要操作** (`add_*`, `copy_*`): 轮廓样式（透明背景，蓝色边框）
- **其他操作**: 幽灵样式（透明背景，悬停时变色）

### 图标映射
每种命令都有对应的图标：
- 导航跳转: 外部链接图标
- 数据导出: 下载图标
- 查看详情: 眼睛图标
- 添加操作: 加号图标
- 复制操作: 复制图标

## 自定义扩展

### 添加新命令
在 `actionCommandHandler.ts` 中注册新的命令处理器：
```typescript
registerCommandHandler('my_command', (params) => {
  // 自定义处理逻辑
  console.log('执行自定义命令', params);
});
```

### 自定义按钮样式
可以通过传递样式参数自定义按钮外观：
```typescript
<ActionButtons 
  buttons={buttons} 
  variant="outline" 
  size="lg" 
  className="my-custom-class"
/>
```

## 安全考虑

1. **参数验证**: 所有命令都会验证必需参数
2. **URL编码**: 自动对URL参数进行编码，防止XSS
3. **命令白名单**: 只能执行预定义的命令，防止任意代码执行
4. **新窗口打开**: 外部跳转默认在新标签页打开，保护主应用状态

## 最佳实践

### AI回答中的使用
1. **按钮位置**: 建议在回答末尾添加按钮，避免打断阅读
2. **按钮数量**: 单条消息建议不超过3-4个按钮，避免界面混乱
3. **语义清晰**: 按钮文本要清楚说明操作内容
4. **相关性**: 确保按钮操作与消息内容相关

### 开发建议
1. **错误处理**: 命令处理器应该有完善的错误处理
2. **用户反馈**: 操作执行时提供适当的加载和成功提示
3. **测试覆盖**: 为新命令添加相应的测试用例

## 故障排查

### 常见问题

#### 按钮不显示
- 检查按钮代码格式是否正确
- 确保消息来源是AI回答（用户消息不会显示按钮）
- 验证导入路径是否正确

#### 按钮点击无效果
- 检查命令是否已注册
- 查看浏览器控制台错误信息
- 验证参数格式是否正确

#### 页面跳转失败
- 确认目标URL是否有效
- 检查路由配置是否正确
- 验证权限设置

### 调试技巧
1. 在浏览器控制台查看解析结果：
   ```javascript
   import { parseActionButtons } from './actionButtonParser';
   console.log(parseActionButtons('[BUTTON:测试|navigate|url=/test]'));
   ```

2. 监控命令执行：
   ```javascript
   // 在 actionCommandHandler.ts 的 executeCommand 函数中添加调试日志
   console.log('执行命令:', command, params);
   ```

---

**版本**: 1.0.0  
**最后更新**: 2025-08-30  
**维护者**: 开发团队