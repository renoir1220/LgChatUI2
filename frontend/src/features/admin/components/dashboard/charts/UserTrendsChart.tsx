import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { dashboardApi, type UserUsageTrend, type TopUser } from '../../../services/dashboardApi';

interface UserTrendsChartProps {
  days: number;
}

const UserTrendsChart: React.FC<UserTrendsChartProps> = ({ days }) => {
  const [data, setData] = useState<{ trends: UserUsageTrend[]; topUsers: TopUser[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getUserTrends(days);
        setData(result);
      } catch (error) {
        console.error('加载用户趋势数据失败:', error);
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

  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        暂无数据
      </div>
    );
  }

  const totalActiveUsers = data.trends.reduce((sum, item) => sum + item.activeUsers, 0);
  const totalNewUsers = data.trends.reduce((sum, item) => sum + item.newUsers, 0);

  return (
    <div className="space-y-6">
      {/* 用户活跃度图表 */}
      <div className="space-y-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">活跃用户</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">新用户</span>
          </div>
        </div>

        {/* 图表占位符 */}
        <div className="h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">用户活跃度折线图</p>
            <p className="text-sm">ECharts 图表将在这里显示</p>
            <p className="text-xs mt-2">
              总活跃用户: {totalActiveUsers} | 新用户: {totalNewUsers}
            </p>
          </div>
        </div>
      </div>

      {/* TOP活跃用户表格 */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">TOP活跃用户</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">用户</th>
                <th className="text-right p-3">会话数</th>
                <th className="text-right p-3">消息数</th>
                <th className="text-right p-3">最后活跃</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((user, index) => (
                <tr key={user.userHash} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        #{index + 1}
                      </div>
                      <span className="font-medium">{user.userHash}</span>
                    </div>
                  </td>
                  <td className="text-right p-3">{user.conversationCount}</td>
                  <td className="text-right p-3">{user.messageCount}</td>
                  <td className="text-right p-3 text-muted-foreground">
                    {new Date(user.lastActiveAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserTrendsChart;