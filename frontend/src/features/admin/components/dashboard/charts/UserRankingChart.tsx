import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardApi, type UserRankingData } from '../../../services/dashboardApi';

echarts.use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CanvasRenderer
]);

// 状态管理
let globalLimit = '10';
let globalSetLimit: ((value: string) => void) | undefined;

// TOP选择器组件
const TopSelector: React.FC = () => {
  const [limit, setLimit] = useState<string>('10');

  React.useEffect(() => {
    globalLimit = limit;
    if (globalSetLimit) {
      globalSetLimit(limit);
    }
  }, [limit]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">显示:</span>
      <Select value={limit} onValueChange={setLimit}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">TOP 5</SelectItem>
          <SelectItem value="10">TOP 10</SelectItem>
          <SelectItem value="20">TOP 20</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

type UserRankingChartComponent = React.FC & {
  TopSelector: React.FC;
};

const UserRankingChart: UserRankingChartComponent = () => {
  const [data, setData] = useState<UserRankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<string>('10');

  globalSetLimit = setLimit;

  // 准备图表数据 - 必须在所有条件语句之前
  const chartOption = useMemo(() => {
    if (!data || data.length === 0 || loading) {
      return {};
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0];
          const user = data[param.dataIndex];
          return `
            <strong>${param.name}</strong><br/>
            消息数: <span style="color:#3b82f6">${param.value}</span><br/>
            会话数: ${user.conversationCount}<br/>
            最后活跃: ${new Date(user.lastActiveAt).toLocaleDateString()}
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.userHash),
        axisLabel: {
          fontSize: 11,
          width: 80,
          overflow: 'truncate'
        },
        inverse: true // 让排名第一的在最上面
      },
      series: [
        {
          name: '消息数',
          type: 'bar',
          data: data.map(item => item.messageCount),
          itemStyle: {
            color: '#3b82f6'
          },
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            fontSize: 12
          }
        }
      ]
    };
  }, [data, loading]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getUserRanking(parseInt(limit));
        setData(result);
      } catch (error) {
        console.error('加载用户排行数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [limit]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-4"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data[0]?.messageCount}</p>
              <p className="text-sm text-muted-foreground">最高消息数</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(data.reduce((sum, u) => sum + u.messageCount, 0) / data.length)}
              </p>
              <p className="text-sm text-muted-foreground">平均消息数</p>
            </div>
          </div>
        </div>
      )}

      {/* ECharts横向柱状图 */}
      <div className="h-96">
        {data.length > 0 && Object.keys(chartOption).length > 0 ? (
          <ReactEChartsCore
            echarts={echarts}
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div className="h-full border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">暂无用户数据</p>
              <p className="text-sm">等待用户使用系统产生数据</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// 添加TopSelector作为静态属性
UserRankingChart.TopSelector = TopSelector;

export default UserRankingChart;