import React, { useState, useEffect } from 'react';
import { dashboardApi, type TimeDistribution } from '../../../services/dashboardApi';

interface TimeHeatmapProps {
  days: number;
}

const TimeHeatmap: React.FC<TimeHeatmapProps> = ({ days }) => {
  const [data, setData] = useState<TimeDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getTimeDistribution(days);
        setData(result);
      } catch (error) {
        console.error('加载时间分布数据失败:', error);
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

  // 分析峰值时段
  const sortedData = [...data].sort((a, b) => b.messageCount - a.messageCount);
  const peakHours = sortedData.slice(0, 3);
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="space-y-6">
      {/* 热力图占位符 */}
      <div className="h-80 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">24x7 使用热力图</p>
          <p className="text-sm">ECharts 热力图将在这里显示</p>
          <p className="text-xs mt-2">数据点: {data.length} 个时段</p>
        </div>
      </div>

      {/* 峰值统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">峰值时段TOP3</h4>
          {peakHours.map((peak, index) => (
            <div key={`${peak.dayOfWeek}-${peak.hour}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">
                  {dayNames[peak.dayOfWeek]} {peak.hour.toString().padStart(2, '0')}:00
                </p>
                <p className="text-sm text-muted-foreground">
                  第{index + 1}峰值时段
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{peak.messageCount}</p>
                <p className="text-xs text-muted-foreground">消息数</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">使用模式分析</h4>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium text-blue-700 dark:text-blue-300">工作时间活跃度</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                9:00-18:00 时段占比较高
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-medium text-green-700 dark:text-green-300">周末使用情况</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                周末活跃度相对较低
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">时段统计</h4>
          <div className="space-y-2">
            {[
              { label: '早高峰 (8-10时)', value: data.filter(d => d.hour >= 8 && d.hour <= 10).reduce((sum, d) => sum + d.messageCount, 0) },
              { label: '午间 (11-13时)', value: data.filter(d => d.hour >= 11 && d.hour <= 13).reduce((sum, d) => sum + d.messageCount, 0) },
              { label: '下午 (14-17时)', value: data.filter(d => d.hour >= 14 && d.hour <= 17).reduce((sum, d) => sum + d.messageCount, 0) },
              { label: '晚间 (18-22时)', value: data.filter(d => d.hour >= 18 && d.hour <= 22).reduce((sum, d) => sum + d.messageCount, 0) },
            ].map((stat, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded">
                <span className="text-sm">{stat.label}</span>
                <span className="font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeHeatmap;