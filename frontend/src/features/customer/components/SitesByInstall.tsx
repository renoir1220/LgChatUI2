import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';
import { ChevronDown, ChevronRight, Loader2, Calendar, CheckCircle } from 'lucide-react';
import { useSites } from '../hooks/useSites';

interface SitesByInstallProps {
  customerId?: string;
  customerName?: string;
}

export const SitesByInstall: React.FC<SitesByInstallProps> = ({
  customerId,
  customerName,
}) => {
  const { installGroups, loading, error } = useSites(customerId, customerName);
  
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">按装机单展示</h2>
        <Badge variant="secondary">{installGroups.length} 个装机单</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {installGroups.map((group) => (
              <Collapsible 
                key={group.installCode}
                open={openStates[group.installCode] || false}
                onOpenChange={() => toggleOpen(group.installCode)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openStates[group.installCode] ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {group.installCode}
                        </span>
                        <Badge 
                          variant={group.documentStatus === '已验收' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {group.documentStatus}
                        </Badge>
                        {group.projectSummary && (
                          <span className="text-xs text-muted-foreground max-w-40 truncate">
                            {group.projectSummary}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>完成: {formatDate(group.completeDate)}</span>
                      {group.acceptanceDate && (
                        <span>验收: {formatDate(group.acceptanceDate)}</span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {group.sites.length} 项
                      </Badge>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-3">
                    <div className="ml-6 pl-3 border-l-2 border-muted space-y-1">
                      {group.sites.map((site, index) => (
                        <div 
                          key={`${site.installId}-${index}`} 
                          className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {site.productSubcategory}
                            </Badge>
                            <span className="text-sm">{site.siteName}</span>
                            {site.businessType && (
                              <Badge variant="secondary" className="text-xs">
                                {site.businessType}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-primary">
                              {site.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground">个</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
