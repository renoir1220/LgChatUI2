import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardApi, type DailyUsageData } from '../../../services/dashboardApi';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
]);

interface DailyUsageChartProps {
  days: string;
}

const DailyUsageChart: React.FC<DailyUsageChartProps> = ({ days }) => {
  const [data, setData] = useState<DailyUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  // 准备图表数据 - 必须在所有条件语句之前
  const chartOption = useMemo(() => {
    if (!data || data.length === 0 || loading) {
      return {};
    }

    // 反转数据以按时间正序显示
    const sortedData = [...data].reverse();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let content = `<strong>${date}</strong><br/>`;
          params.forEach((param: any) => {
            content += `<span style="color:${param.color}">${param.seriesName}:</span> ${param.value}<br/>`;
          });
          return content;
        }
      },
      legend: {
        data: ['会话数', '消息数'],
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: sortedData.map(item => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '会话数',
          position: 'left',
          axisLabel: {
            fontSize: 12
          }
        },
        {
          type: 'value',
          name: '消息数',
          position: 'right',
          axisLabel: {
            fontSize: 12
          }
        }
      ],
      series: [
        {
          name: '会话数',
          type: 'line',
          yAxisIndex: 0,
          data: sortedData.map(item => item.conversations),
          smooth: true,
          itemStyle: {
            color: '#3b82f6'
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ]
            }
          }
        },
        {
          name: '消息数',
          type: 'line',
          yAxisIndex: 1,
          data: sortedData.map(item => item.messages),
          smooth: true,
          itemStyle: {
            color: '#10b981'
          },
          lineStyle: {
            color: '#10b981',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
              ]
            }
          }
        }
      ]
    };
  }, [data, loading]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getDailyUsage(parseInt(days));
        setData(result);
      } catch (error) {
        console.error('加载每日用量数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-48 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // 计算统计数据
  const totalConversations = data.reduce((sum, item) => sum + item.conversations, 0);
  const totalMessages = data.reduce((sum, item) => sum + item.messages, 0);
  const avgConversations = totalConversations / data.length || 0;
  const avgMessages = totalMessages / data.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">会话数</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">消息数</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalConversations}</p>
            <p className="text-sm text-muted-foreground">总会话数</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalMessages}</p>
            <p className="text-sm text-muted-foreground">总消息数</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{avgConversations.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">日均会话</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{avgMessages.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">日均消息</p>
          </div>
        </Card>
      </div>

      {/* ECharts图表 */}
      <div className="h-80">
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
              <p className="text-lg font-medium">暂无数据</p>
              <p className="text-sm">选择不同的时间范围查看数据</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DailyUsageChart;