# Admin Dashboard 真实数据实施计划

## 🎯 项目目标
将admin/dashboard功能中的图表占位符替换为真实的ECharts图表，实现完整的数据可视化。

## 📊 现状分析

### ✅ 已完成部分
- **后端API完全真实化**：所有统计API都连接真实数据库
- **前端数据获取**：组件都调用真实API获取数据
- **数据架构完善**：数据库Schema支持所有统计维度

### 🚧 待完成部分
- **图表可视化**：5个主要图表组件使用占位符需要替换
- **部分功能缺失**：知识库选择器、反馈标签统计

## 📋 详细实施步骤

### 第一步：安装ECharts依赖
```bash
cd frontend
npm install echarts echarts-for-react
```

### 第二步：每日用量趋势图 (`DailyUsageChart.tsx`)
**API**: `dashboardApi.getDailyUsage(days, knowledgeBaseId?)`
**数据格式**:
```typescript
interface DailyUsageData {
  date: string;
  conversations: number;
  messages: number;
  knowledgeBaseId?: number;
}
```
**图表类型**: ECharts双折线图（会话数 vs 消息数）
**替换位置**: Line 104-110 占位符div

### 第三步：用户活跃度趋势图 (`UserTrendsChart.tsx`)
**API**: `dashboardApi.getUserTrends(days)`
**数据格式**:
```typescript
interface UserUsageTrend {
  date: string;
  activeUsers: number;
  newUsers: number;
}
```
**图表类型**: ECharts双折线图（活跃用户 vs 新用户）
**替换位置**: Line 67-75 占位符div

### 第四步：时间集中度热力图 (`TimeHeatmap.tsx`)
**API**: `dashboardApi.getTimeDistribution(days)`
**数据格式**:
```typescript
interface TimeDistribution {
  hour: number;        // 0-23
  dayOfWeek: number;   // 0-6 (0=周日)
  messageCount: number;
  conversationCount: number;
}
```
**图表类型**: ECharts 24x7热力图
**替换位置**: Line 47-53 占位符div

### 第五步：客户端分布图表 (`ClientDistribution.tsx`)
**API**: `dashboardApi.getClientDistribution(days)`
**图表类型**:
- 设备类型饼图 (Line 119-127)
- 移动端vs PC端趋势图 (Line 133-139)

### 第六步：反馈质量图表 (`FeedbackQuality.tsx`)
**API**: `dashboardApi.getFeedbackQuality(days)`
**图表类型**:
- 反馈分布饼图 (Line 66-72)
- 满意度趋势折线图 (Line 78-84)

### 第七步：补充缺失功能
1. **知识库选择器API** - 为DailyUsageChart添加知识库筛选
2. **反馈标签统计** - 完善dashboard.service.ts中的TODO项

## 🔧 技术实施规范

### ECharts配置模板
```typescript
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, PieChart, HeatmapChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  CanvasRenderer
]);
```

### 主题适配
- 支持明暗主题切换
- 使用项目现有的CSS变量
- 响应式尺寸调整

### 错误处理
- 数据加载失败时显示友好提示
- 空数据状态处理
- 网络错误重试机制

## ⚠️ 重要注意事项

### SQL查询验证
每个步骤实施后需要验证：
1. **数据准确性**：与数据库实际数据对比
2. **性能表现**：查询响应时间
3. **边界情况**：空数据、大数据量等

### 分步验收机制
每完成一个看板元素，立即进行：
1. 功能测试
2. 数据验证
3. 用户验收
4. 问题修复

### 数据库优化建议
```sql
-- 为dashboard查询添加索引
CREATE INDEX IX_AI_MESSAGES_CREATED_AT_ROLE ON AI_MESSAGES(CREATED_AT, ROLE);
CREATE INDEX IX_AI_CONVERSATIONS_CREATED_AT_KB ON AI_CONVERSATIONS(CREATED_AT, KNOWLEDGE_BASE_ID);
CREATE INDEX IX_AI_MESSAGE_FEEDBACK_CREATED_AT_TYPE ON AI_MESSAGE_FEEDBACK(CREATED_AT, FEEDBACK_TYPE, IS_DELETED);
```

## 📈 预期成果

完成后将实现：
- ✅ 5个核心图表的真实数据可视化
- ✅ 完整的时间范围筛选功能
- ✅ 响应式图表设计
- ✅ 明暗主题支持
- ✅ 生产级别的Dashboard功能

## 🚀 开始实施

从第一步开始，逐步实现每个看板元素，确保每一步都经过验证再进行下一步。