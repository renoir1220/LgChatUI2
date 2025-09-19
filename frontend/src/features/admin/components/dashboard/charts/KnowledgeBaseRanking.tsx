import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { dashboardApi, type KnowledgeBaseStats } from '../../../services/dashboardApi';

const KnowledgeBaseRanking: React.FC = () => {
  const [data, setData] = useState<KnowledgeBaseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dashboardApi.getKnowledgeBaseRanking();
        setData(result);
      } catch (error) {
        console.error('加载知识库排行数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growthRate < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (growthRate: number) => {
    if (growthRate > 5) return 'text-green-600';
    if (growthRate < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-1"></div>
            <div className="h-2 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无知识库使用数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 知识库排行卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((kb, index) => (
          <div
            key={kb.id}
            className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <h4 className="font-semibold text-lg truncate">{kb.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  ID: {kb.id}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(kb.growthRate)}
                <span className={getTrendColor(kb.growthRate)}>
                  {kb.growthRate > 0 ? '+' : ''}{kb.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">使用率</span>
                  <span className="text-sm font-medium">{kb.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={kb.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{kb.conversationCount}</p>
                  <p className="text-xs text-muted-foreground">会话数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{kb.messageCount}</p>
                  <p className="text-xs text-muted-foreground">消息数</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 使用情况概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
            最受欢迎知识库
          </h4>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {data[0]?.name || '暂无数据'}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            使用率 {data[0]?.percentage.toFixed(1) || 0}%
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
            增长最快知识库
          </h4>
          {(() => {
            const fastest = data.reduce((prev, current) =>
              current.growthRate > prev.growthRate ? current : prev
            , data[0] || { name: '暂无数据', growthRate: 0 });
            return (
              <>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {fastest.name}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  增长率 +{fastest.growthRate.toFixed(1)}%
                </p>
              </>
            );
          })()}
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
            知识库总数
          </h4>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {data.length}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            活跃知识库数量
          </p>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">排名</th>
              <th className="text-left p-3">知识库名称</th>
              <th className="text-right p-3">会话数</th>
              <th className="text-right p-3">消息数</th>
              <th className="text-right p-3">使用率</th>
              <th className="text-right p-3">增长率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((kb, index) => (
              <tr key={kb.id} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                </td>
                <td className="p-3 font-medium">{kb.name}</td>
                <td className="text-right p-3">{kb.conversationCount}</td>
                <td className="text-right p-3">{kb.messageCount}</td>
                <td className="text-right p-3">{kb.percentage.toFixed(1)}%</td>
                <td className="text-right p-3">
                  <div className="flex items-center justify-end gap-1">
                    {getTrendIcon(kb.growthRate)}
                    <span className={getTrendColor(kb.growthRate)}>
                      {kb.growthRate > 0 ? '+' : ''}{kb.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KnowledgeBaseRanking;