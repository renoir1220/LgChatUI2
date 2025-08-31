import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Table, TableRow, TableBody, TableCell, TableCaption, TableHeader, TableHead } from '../../../components/ui/table';
import { Loader2 } from 'lucide-react';
import { useSites } from '../hooks/useSites';

interface SitesSummaryProps {
  customerId?: string;
  customerName?: string;
  /** 是否显示内部标题（默认为false，由外部显示在CurrentCustomerBar中） */
  showTitle?: boolean;
  /** 当有数据时的右侧内容渲染回调 */
  onRenderRightContent?: (rightContent: React.ReactNode) => void;
}

export const SitesSummary: React.FC<SitesSummaryProps> = ({
  customerId,
  customerName,
  showTitle = false,
  onRenderRightContent
}) => {
  const { summaryData, loading, error } = useSites(customerId, customerName);

  // 汇总页仅使用单层表格展示，不做分组/折叠

  // 当数据加载成功时，通知父组件右侧内容
  React.useEffect(() => {
    if (!loading && !error && summaryData.length > 0 && onRenderRightContent) {
      const rightContent = (
        <Badge variant="secondary">{summaryData.length} 种配置</Badge>
      );
      onRenderRightContent(rightContent);
    } else if (onRenderRightContent) {
      onRenderRightContent(null);
    }
  }, [loading, error, summaryData, onRenderRightContent]);

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
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">站点信息汇总</h2>
          <Badge variant="secondary">{summaryData.length} 种配置</Badge>
        </div>
      )}

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2" aria-hidden={false}>
        {summaryData.map((item, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium truncate">{item.siteName}</div>
              <div className="shrink-0 text-base font-semibold text-primary">{item.totalQuantity}</div>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="shrink-0">小类</span>
              <Badge variant="outline" className="text-xs">{item.productSubcategory}</Badge>
            </div>
          </div>
        ))}
        <div className="text-xs text-muted-foreground">共 {summaryData.length} 条配置汇总</div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block" aria-hidden={false}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">产品小类</TableHead>
                  <TableHead>站点名称</TableHead>
                  <TableHead className="w-24 text-right">数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="align-middle w-44">
                      <Badge variant="outline" className="text-xs">
                        {item.productSubcategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.siteName}</TableCell>
                    <TableCell className="text-right w-24">
                      <span className="text-base font-semibold text-primary">{item.totalQuantity}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>共 {summaryData.length} 条配置汇总</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
