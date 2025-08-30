import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useSites } from '../hooks/useSites';

interface SitesSummaryProps {
  customerId?: string;
  customerName?: string;
}

export const SitesSummary: React.FC<SitesSummaryProps> = ({
  customerId,
  customerName,
}) => {
  const { summaryData, loading, error } = useSites(customerId, customerName);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">加载站点信息...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>加载失败: {error}</p>
      </div>
    );
  }

  if (summaryData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无站点信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">站点信息汇总</h2>
        <Badge variant="secondary">{summaryData.length} 种配置</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {summaryData.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.productSubcategory}
                  </Badge>
                  <span className="font-medium text-sm">{item.siteName}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-base font-semibold text-primary">
                    {item.totalQuantity}
                  </span>
                  <span className="text-xs text-muted-foreground">个</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};