import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DailyUsageChart from './charts/DailyUsageChart';
import UserRankingChart from './charts/UserRankingChart';
import FeedbackTrendsChart from './charts/FeedbackTrendsChart';
import ClientUsageChart from './charts/ClientUsageChart';

const DashboardPage: React.FC = () => {
  const [globalDays, setGlobalDays] = useState<string>('30');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据统计看板</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">时间范围：</span>
          <Select value={globalDays} onValueChange={setGlobalDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近7天</SelectItem>
              <SelectItem value="30">近30天</SelectItem>
              <SelectItem value="90">近90天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 1. 总用量和按天趋势 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">总用量和按天趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyUsageChart days={globalDays} />
        </CardContent>
      </Card>

      {/* 2. 用户排行 + 客户端分析并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">用户用量排行</CardTitle>
              <UserRankingChart.TopSelector />
            </div>
          </CardHeader>
          <CardContent>
            <UserRankingChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">客户端用量分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientUsageChart />
          </CardContent>
        </Card>
      </div>

      {/* 3. 评价趋势（点赞、点踩） */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">评价趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackTrendsChart days={globalDays} />
        </CardContent>
      </Card>

    </div>
  );
};

export default DashboardPage;