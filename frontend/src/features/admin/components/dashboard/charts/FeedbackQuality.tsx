import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { dashboardApi, type FeedbackStats } from '../../../services/dashboardApi';

interface FeedbackQualityProps {
  days: number;
}

const FeedbackQuality: React.FC<FeedbackQualityProps> = ({ days }) => {
  const [data, setData] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getFeedbackQuality(days);
        setData(result);
      } catch (error) {
        console.error('加载反馈质量数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无反馈数据
      </div>
    );
  }

  const totalFeedback = data.helpful + data.notHelpful + data.partiallyHelpful;
  const satisfactionRate = totalFeedback > 0 ? (data.helpful / totalFeedback) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 反馈分布和趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 反馈分布饼图占位符 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">反馈分布</h4>
          <div className="h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">反馈分布饼图</p>
              <p className="text-sm">ECharts 饼图将在这里显示</p>
              <p className="text-xs mt-2">总反馈: {totalFeedback} 条</p>
            </div>
          </div>
        </div>

        {/* 满意度趋势图占位符 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">满意度趋势</h4>
          <div className="h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">满意度趋势图</p>
              <p className="text-sm">ECharts 折线图将在这里显示</p>
              <p className="text-xs mt-2">数据点: {data.trends.length} 个</p>
            </div>
          </div>
        </div>
      </div>

      {/* 反馈统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">有用反馈</p>
                <p className="text-2xl font-bold text-green-600">{data.helpful}</p>
                <p className="text-xs text-muted-foreground">
                  占比 {totalFeedback > 0 ? ((data.helpful / totalFeedback) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">无用反馈</p>
                <p className="text-2xl font-bold text-red-600">{data.notHelpful}</p>
                <p className="text-xs text-muted-foreground">
                  占比 {totalFeedback > 0 ? ((data.notHelpful / totalFeedback) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <ThumbsDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">部分有用</p>
                <p className="text-2xl font-bold text-orange-600">{data.partiallyHelpful}</p>
                <p className="text-xs text-muted-foreground">
                  占比 {totalFeedback > 0 ? ((data.partiallyHelpful / totalFeedback) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Meh className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">反馈覆盖率</p>
                <p className="text-2xl font-bold text-blue-600">{data.coverageRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  平均评分 {data.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Badge variant="outline" className="text-xs">
                  {data.coverageRate > 80 ? '优' : data.coverageRate > 60 ? '良' : data.coverageRate > 40 ? '中' : '低'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 质量分析 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
            整体满意度
          </h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {satisfactionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {satisfactionRate > 80 ? '用户满意度很高' :
             satisfactionRate > 60 ? '用户满意度良好' :
             satisfactionRate > 40 ? '用户满意度一般' : '需要改进用户体验'}
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
            反馈活跃度
          </h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.coverageRate.toFixed(1)}%
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {data.coverageRate > 30 ? '用户积极参与反馈' : '可以鼓励更多用户提供反馈'}
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
            改进建议
          </h4>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            {data.notHelpful > data.helpful ?
              '重点关注负面反馈，优化回答质量' :
              data.coverageRate < 30 ?
              '增加反馈提示，提高用户参与度' :
              '继续保持现有服务质量'}
          </p>
        </div>
      </div>

      {/* 最近反馈趋势表格 */}
      {data.trends.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium">最近满意度趋势</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">日期</th>
                  <th className="text-right p-3">满意度</th>
                  <th className="text-right p-3">趋势</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.slice(0, 7).map((trend, index) => {
                  const prevSatisfaction = index < data.trends.length - 1 ? data.trends[index + 1].satisfaction : trend.satisfaction;
                  const change = trend.satisfaction - prevSatisfaction;
                  return (
                    <tr key={trend.date} className="border-b hover:bg-muted/50">
                      <td className="p-3">{trend.date}</td>
                      <td className="text-right p-3">{trend.satisfaction.toFixed(1)}%</td>
                      <td className="text-right p-3">
                        <span className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      </td>
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

export default FeedbackQuality;