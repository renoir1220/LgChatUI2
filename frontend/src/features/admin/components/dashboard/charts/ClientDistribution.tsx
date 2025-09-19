import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, HelpCircle } from 'lucide-react';
import { dashboardApi, type ClientDistributionStats } from '../../../services/dashboardApi';

interface ClientDistributionProps {
  days: number;
}

const ClientDistribution: React.FC<ClientDistributionProps> = ({ days }) => {
  const [data, setData] = useState<ClientDistributionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getClientDistribution(days);
        setData(result);
      } catch (error) {
        console.error('加载客户端分布数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-6 w-6" />;
      case 'desktop': return <Monitor className="h-6 w-6" />;
      case 'tablet': return <Tablet className="h-6 w-6" />;
      default: return <HelpCircle className="h-6 w-6" />;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'mobile': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'desktop': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'tablet': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDeviceName = (type: string) => {
    switch (type) {
      case 'mobile': return '移动端';
      case 'desktop': return 'PC端';
      case 'tablet': return '平板';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无客户端分布数据
      </div>
    );
  }

  const totalDevices = Object.values(data.deviceTypes).reduce((sum, count) => sum + count, 0);
  const mobilePercentage = totalDevices > 0 ? (data.deviceTypes.mobile / totalDevices) * 100 : 0;
  const desktopPercentage = totalDevices > 0 ? (data.deviceTypes.desktop / totalDevices) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 设备类型分布卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(data.deviceTypes).map(([type, count]) => {
          const percentage = totalDevices > 0 ? (count / totalDevices) * 100 : 0;
          return (
            <Card key={type}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{getDeviceName(type)}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      占比 {percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getDeviceColor(type)}`}>
                    {getDeviceIcon(type)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 设备类型饼图占位符 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">设备类型分布</h4>
          <div className="h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">设备类型饼图</p>
              <p className="text-sm">ECharts 饼图将在这里显示</p>
              <p className="text-xs mt-2">
                移动端 {mobilePercentage.toFixed(1)}% | PC端 {desktopPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 移动端vs PC端趋势图占位符 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">移动端 vs PC端趋势</h4>
          <div className="h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">设备趋势图</p>
              <p className="text-sm">ECharts 双折线图将在这里显示</p>
              <p className="text-xs mt-2">数据点: {data.trends.length} 个</p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作系统和浏览器分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 操作系统排行 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">操作系统排行</h4>
          <div className="space-y-3">
            {data.platforms.slice(0, 5).map((platform, index) => (
              <div key={platform.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  <span className="font-medium">{platform.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{platform.count}</p>
                  <p className="text-xs text-muted-foreground">{platform.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 浏览器分布 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">浏览器分布</h4>
          <div className="space-y-3">
            {data.browsers.slice(0, 5).map((browser, index) => (
              <div key={browser.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  <span className="font-medium">{browser.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{browser.count}</p>
                  <p className="text-xs text-muted-foreground">{browser.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 使用情况分析 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
            移动端占比
          </h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {mobilePercentage.toFixed(1)}%
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {mobilePercentage > 60 ? '移动优先用户群体' :
             mobilePercentage > 40 ? '移动端使用活跃' :
             '以PC端用户为主'}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
            主要平台
          </h4>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {data.platforms[0]?.name || '暂无数据'}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            使用率 {data.platforms[0]?.percentage.toFixed(1) || 0}%
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
            主要浏览器
          </h4>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {data.browsers[0]?.name || '暂无数据'}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            使用率 {data.browsers[0]?.percentage.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* 详细趋势数据表格 */}
      {data.trends.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium">设备使用趋势 (最近7天)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">日期</th>
                  <th className="text-right p-3">移动端</th>
                  <th className="text-right p-3">PC端</th>
                  <th className="text-right p-3">平板</th>
                  <th className="text-right p-3">总计</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.slice(0, 7).map((trend) => {
                  const total = trend.mobile + trend.desktop + trend.tablet;
                  return (
                    <tr key={trend.date} className="border-b hover:bg-muted/50">
                      <td className="p-3">{trend.date}</td>
                      <td className="text-right p-3 text-blue-600">{trend.mobile}</td>
                      <td className="text-right p-3 text-green-600">{trend.desktop}</td>
                      <td className="text-right p-3 text-orange-600">{trend.tablet}</td>
                      <td className="text-right p-3 font-medium">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDistribution;