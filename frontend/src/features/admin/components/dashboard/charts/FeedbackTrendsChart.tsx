import React, { useState, useEffect, useMemo } from 'react';
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
import { dashboardApi, type FeedbackTrendData } from '../../../services/dashboardApi';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
]);

interface FeedbackTrendsChartProps {
  days: string;
}

const FeedbackTrendsChart: React.FC<FeedbackTrendsChartProps> = ({ days }) => {
  const [data, setData] = useState<FeedbackTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const chartOption = useMemo(() => {
    if (!data || data.length === 0 || loading) {
      return {};
    }

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
        data: ['点赞', '点踩'],
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
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '点赞',
          type: 'line',
          data: sortedData.map(item => item.helpful),
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
        },
        {
          name: '点踩',
          type: 'line',
          data: sortedData.map(item => item.notHelpful),
          smooth: true,
          itemStyle: {
            color: '#ef4444'
          },
          lineStyle: {
            color: '#ef4444',
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
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
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
        const result = await dashboardApi.getFeedbackTrends(parseInt(days));
        setData(result);
      } catch (error) {
        console.error('加载评价趋势数据失败:', error);
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

  const totalHelpful = data.reduce((sum, item) => sum + item.helpful, 0);
  const totalNotHelpful = data.reduce((sum, item) => sum + item.notHelpful, 0);
  const totalFeedback = totalHelpful + totalNotHelpful;
  const helpfulRate = totalFeedback > 0 ? (totalHelpful / totalFeedback * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">点赞</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">点踩</span>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalHelpful}</p>
            <p className="text-sm text-muted-foreground">总点赞</p>
          </div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{totalNotHelpful}</p>
            <p className="text-sm text-muted-foreground">总点踩</p>
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalFeedback}</p>
            <p className="text-sm text-muted-foreground">总评价</p>
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{helpfulRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">满意度</p>
          </div>
        </div>
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
              <p className="text-lg font-medium">暂无评价数据</p>
              <p className="text-sm">等待用户对AI回复进行评价</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackTrendsChart;