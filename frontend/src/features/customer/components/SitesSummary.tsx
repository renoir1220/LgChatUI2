import React from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Table, TableRow, TableBody, TableCell, TableCaption, TableHeader, TableHead } from '../../../components/ui/table';
import { Loader2 } from 'lucide-react';
import { useSites } from '../hooks/useSites';
import { Button } from '../../../components/ui/button';

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
  const { sites } = useSites(customerId, customerName);

  // 计算按月分布：以三个日期的最小/最大为范围
  const monthlyData = React.useMemo(() => {
    const parse = (dateStr: string | null | undefined) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    let minD: Date | null = null;
    let maxD: Date | null = null;
    for (const s of sites as any[]) {
      const c = parse((s as any).createTime ?? (s as any).create_time);
      const f = parse(s.completeDate as any);
      const a = parse(s.acceptanceDate as any);
      for (const d of [c, f, a]) {
        if (d) {
          if (!minD || d < minD) minD = d;
          if (!maxD || d > maxD) maxD = d;
        }
      }
    }

    // 无有效日期则用最近12个月
    if (!minD || !maxD) {
      const now = new Date();
      minD = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      maxD = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      minD = new Date(minD.getFullYear(), minD.getMonth(), 1);
      maxD = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    }

    const months: { key: string; label: string; year: number; month: number; apply: any[]; complete: any[]; accept: any[] }[] = [];
    const iter = new Date(minD);
    while (iter <= maxD) {
      const key = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}`;
      const label = `${iter.getFullYear()}年${iter.getMonth() + 1}月`;
      months.push({ key, label, year: iter.getFullYear(), month: iter.getMonth() + 1, apply: [], complete: [], accept: [] });
      iter.setMonth(iter.getMonth() + 1);
    }

    const monthKey = (dateStr: string | null | undefined) => {
      const d = parse(dateStr);
      if (!d) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    sites.forEach((s: any) => {
      const kApply = monthKey(s.createTime ?? s.create_time);
      const kComplete = monthKey(s.completeDate);
      const kAccept = monthKey(s.acceptanceDate);
      months.forEach((m) => {
        if (kApply === m.key) m.apply.push(s);
        if (kComplete === m.key) m.complete.push(s);
        if (kAccept === m.key) m.accept.push(s);
      });
    });

    return months;
  }, [sites]);

  // 悬浮卡片：使用 Portal + fixed 定位，避免容器裁剪
  const [hoverInfo, setHoverInfo] = React.useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);

  const [hoverMonth, setHoverMonth] = React.useState<null | (typeof monthlyData)[number]>(null);

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>, m: (typeof monthlyData)[number]) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setHoverInfo({ key: m.key, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setHoverMonth(m);
  };
  const handleMove = (e: React.MouseEvent<HTMLDivElement>, m: (typeof monthlyData)[number]) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setHoverInfo({ key: m.key, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setHoverMonth(m);
  };
  const handleLeave = () => {
    setHoverInfo(null);
    setHoverMonth(null);
  };

  // 汇总页仅使用单层表格展示，不做分组/折叠

  // 月份显示控制：默认显示近24个月，可展开显示全部（需放在早期，避免条件返回时hooks顺序变化）
  const [showAllMonths, setShowAllMonths] = React.useState(false);
  const recentMonths = React.useMemo(() => {
    if (monthlyData.length <= 24) return monthlyData;
    return monthlyData.slice(monthlyData.length - 24);
  }, [monthlyData]);
  const displayedMonths = showAllMonths ? monthlyData : recentMonths;
  const heatmapRef = React.useRef<HTMLDivElement | null>(null);

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

      {/* 月度热力图（最近12个月） */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">装机单月度分布</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-amber-500"></span><span>申请</span></div>
              <div className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-blue-500"></span><span>完成</span></div>
              <div className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-emerald-500"></span><span>验收</span></div>
            </div>
          </div>
          <div ref={heatmapRef}>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {displayedMonths.map((m) => {
                const hasAny = m.apply.length + m.complete.length + m.accept.length > 0;
                return (
                  <div
                    key={m.key}
                    className="group relative"
                    onMouseEnter={(e) => handleEnter(e, m)}
                    onMouseMove={(e) => handleMove(e, m)}
                    onMouseLeave={handleLeave}
                  >
                    <div className={`rounded-md border ${hasAny ? 'border-border' : 'border-dashed border-muted-foreground/20'} p-1 w-full`}>
                      <div className="text-[10px] text-center text-muted-foreground mb-1 truncate">{String(m.year).slice(2)}/{m.month}</div>
                      <div className="space-y-1">
                        <div className={`h-2 rounded ${m.apply.length ? 'bg-amber-500' : 'bg-muted'}`}></div>
                        <div className={`h-2 rounded ${m.complete.length ? 'bg-blue-500' : 'bg-muted'}`}></div>
                        <div className={`h-2 rounded ${m.accept.length ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {monthlyData.length > recentMonths.length && (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = !showAllMonths;
                    setShowAllMonths(next);
                    if (next) {
                      requestAnimationFrame(() => {
                        heatmapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    }
                  }}
                >
                  {showAllMonths ? '收起' : '显示全部'}
                </Button>
              </div>
            )}
          </div>
          {hoverInfo && hoverMonth && createPortal(
            <div
              className="fixed z-50 w-80 rounded-md border border-border bg-card text-card-foreground p-3 shadow-lg bg-white dark:bg-neutral-900"
              style={{ left: hoverInfo.x, top: hoverInfo.y, transform: 'translateX(-50%)' }}
            >
              <div className="text-xs font-medium mb-1">{hoverMonth.label}</div>
              <div className="text-xs text-muted-foreground mb-2">
                <div>申请: {hoverMonth.apply.length} 条</div>
                <div>完成: {hoverMonth.complete.length} 条</div>
                <div>验收: {hoverMonth.accept.length} 条</div>
              </div>
              {(hoverMonth.apply.length + hoverMonth.complete.length + hoverMonth.accept.length) > 0 && (
                <div className="max-h-60 overflow-auto space-y-1">
                  {[...hoverMonth.apply.map((s:any)=>({t:'申请', s})), ...hoverMonth.complete.map((s:any)=>({t:'完成', s})), ...hoverMonth.accept.map((s:any)=>({t:'验收', s}))]
                    .slice(0, 16)
                    .map((it, idx) => (
                      <div key={idx} className="text-[11px] flex items-center justify-between gap-2">
                        <span className="truncate">
                          <span className="text-muted-foreground">[{it.t}]</span> {it.s.installCode} - {it.s.siteName}
                        </span>
                        <span className="shrink-0 tabular-nums text-xs text-primary">{it.s.quantity}</span>
                      </div>
                  ))}
                  { (hoverMonth.apply.length + hoverMonth.complete.length + hoverMonth.accept.length) > 16 && (
                    <div className="text-[11px] text-muted-foreground">… 还有更多</div>
                  )}
                </div>
              )}
            </div>,
            document.body
          )}
        </CardContent>
      </Card>

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
