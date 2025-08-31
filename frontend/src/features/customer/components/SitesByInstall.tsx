import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';
import { Table, TableRow, TableBody, TableCell, TableHeader, TableHead } from '../../../components/ui/table';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useSites } from '../hooks/useSites';

interface SitesByInstallProps {
  customerId?: string;
  customerName?: string;
  /** 是否显示内部标题（默认为false，由外部显示在CurrentCustomerBar中） */
  showTitle?: boolean;
  /** 当有数据时的右侧内容渲染回调 */
  onRenderRightContent?: (rightContent: React.ReactNode) => void;
}

export const SitesByInstall: React.FC<SitesByInstallProps> = ({
  customerId,
  customerName,
  showTitle = false,
  onRenderRightContent
}) => {
  const { installGroups, loading, error } = useSites(customerId, customerName);
  
  // 当数据加载成功时，通知父组件右侧内容
  React.useEffect(() => {
    if (!loading && !error && installGroups.length > 0 && onRenderRightContent) {
      const rightContent = (
        <Badge variant="secondary">{installGroups.length} 个装机单</Badge>
      );
      onRenderRightContent(rightContent);
    } else if (onRenderRightContent) {
      onRenderRightContent(null);
    }
  }, [loading, error, installGroups, onRenderRightContent]);
  
  // 控制展开状态，默认只有一个装机单时展开，多个时都折叠
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    if (installGroups.length === 1) {
      return { [installGroups[0].installCode]: true };
    }
    return {};
  });

  const toggleOpen = (installCode: string) => {
    setOpenStates(prev => ({
      ...prev,
      [installCode]: !prev[installCode]
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">加载装机单信息...</span>
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

  if (installGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无装机单信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">按装机单展示</h2>
          <Badge variant="secondary">{installGroups.length} 个装机单</Badge>
        </div>
      )}

      {/* Mobile: card list with collapsible groups */}
      <div className="md:hidden space-y-2" aria-hidden={false}>
        {installGroups.map((group) => (
          <Collapsible
            key={group.installCode}
            open={openStates[group.installCode] || false}
            onOpenChange={() => toggleOpen(group.installCode)}
          >
            <div className="rounded-lg border overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="p-3 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Button variant="ghost" size="sm" className="p-0 h-auto w-6 mt-0.5">
                        {openStates[group.installCode] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{group.installCode}</span>
                          {group.projectSummary && (
                            <span className="text-sm font-medium text-primary/80 truncate">· {group.projectSummary}</span>
                          )}
                          <Badge 
                            variant={group.documentStatus === '已验收' ? 'default' : 'secondary'}
                            className="text-xs shrink-0"
                          >
                            {group.documentStatus}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>完成: {formatDate(group.completeDate)}</span>
                          {group.acceptanceDate && <span>验收: {formatDate(group.acceptanceDate)}</span>}
                          <Badge variant="outline" className="text-xs">{group.sites.length} 项</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2">
                  {group.sites.map((site, index) => (
                    <div key={`${site.installId}-${index}`} className="rounded-md bg-muted/30 p-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{site.siteName}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{site.productSubcategory}</Badge>
                          {site.businessType ? (
                            <Badge variant="secondary" className="text-[10px]">{site.businessType}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-primary">{site.quantity}</div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Desktop: table with expandable groups */}
      <div className="hidden md:block" aria-hidden={false}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {installGroups.map((group) => (
                  <React.Fragment key={group.installCode}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={5} className="p-0">
                        <Collapsible 
                          open={openStates[group.installCode] || false}
                          onOpenChange={() => toggleOpen(group.installCode)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" className="p-0 h-auto w-6">
                                  {openStates[group.installCode] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{group.installCode}</span>
                                  {group.projectSummary && (
                                    <span className="text-sm font-medium text-primary/80 max-w-72 truncate">· {group.projectSummary}</span>
                                  )}
                                  <Badge 
                                    variant={group.documentStatus === '已验收' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {group.documentStatus}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>完成: {formatDate(group.completeDate)}</span>
                                {group.acceptanceDate && <span>验收: {formatDate(group.acceptanceDate)}</span>}
                                <Badge variant="outline" className="text-xs">{group.sites.length} 项</Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-2 pb-3">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/20">
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead className="w-44 text-xs text-muted-foreground">产品小类</TableHead>
                                    <TableHead className="text-xs text-muted-foreground">站点名称</TableHead>
                                    <TableHead className="w-32 text-xs text-muted-foreground">商务类型</TableHead>
                                    <TableHead className="w-24 text-right text-xs text-muted-foreground">数量</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.sites.map((site, index) => (
                                    <TableRow key={`${site.installId}-${index}`} className="hover:bg-transparent">
                                      <TableCell className="w-8"></TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {site.productSubcategory}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="font-medium">{site.siteName}</TableCell>
                                      <TableCell>
                                        {site.businessType ? (
                                          <Badge variant="secondary" className="text-xs">{site.businessType}</Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="text-sm font-semibold text-primary">{site.quantity}</span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
