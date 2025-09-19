import React, { useState, useEffect, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardApi, type ClientUsageData } from '../../../services/dashboardApi';

echarts.use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
]);

const ClientUsageChart: React.FC = () => {
  const [data, setData] = useState<ClientUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  const chartOption = useMemo(() => {
    if (!data || data.length === 0 || loading) {
      return {};
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '客户端类型',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '50%'],
          data: data.map(item => ({
            value: item.count,
            name: item.clientType
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%',
            fontSize: 12
          },
          labelLine: {
            show: true
          }
        }
      ]
    };
  }, [data, loading]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getClientUsage();
        setData(result);
      } catch (error) {
        console.error('加载客户端用量数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const totalMessages = data.reduce((sum, item) => sum + item.count, 0);
  const topClient = data.length > 0 ? data[0] : null;

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalMessages}</p>
            <p className="text-sm text-muted-foreground">总消息数</p>
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {topClient ? topClient.clientType : '--'}
            </p>
            <p className="text-sm text-muted-foreground">主要客户端</p>
          </div>
        </div>
      </div>

      {/* ECharts饼图 */}
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
              <p className="text-lg font-medium">暂无客户端数据</p>
              <p className="text-sm">等待不同客户端的使用数据</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClientUsageChart;