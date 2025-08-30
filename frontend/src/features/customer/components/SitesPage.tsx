import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Search, Building2 } from 'lucide-react';
import { SitesSummary } from './SitesSummary';
import { SitesByInstall } from './SitesByInstall';

export const SitesPage: React.FC = () => {
  const { customerId } = useParams<{ customerId?: string }>();
  const [customerName, setCustomerName] = useState('');
  const [searchMode, setSearchMode] = useState<'id' | 'name'>('id');
  const [currentCustomerId, setCurrentCustomerId] = useState(customerId || '');
  const [currentCustomerName, setCurrentCustomerName] = useState('');

  const handleSearch = () => {
    if (searchMode === 'id') {
      setCurrentCustomerId(customerId || '');
      setCurrentCustomerName('');
    } else {
      setCurrentCustomerName(customerName);
      setCurrentCustomerId('');
    }
  };

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 页面标题和搜索 */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">客户站点信息</h1>
        </div>

        {/* 搜索区域 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={searchMode === 'id' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('id')}
                >
                  客户ID
                </Button>
                <Button
                  variant={searchMode === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchMode('name')}
                >
                  客户名称
                </Button>
              </div>

              <div className="flex-1 flex gap-2">
                {searchMode === 'id' ? (
                  <Input
                    placeholder="请输入客户ID..."
                    value={customerId || ''}
                    disabled={!!customerId}
                    className="flex-1"
                  />
                ) : (
                  <Input
                    placeholder="请输入客户名称..."
                    value={customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                )}
                
                <Button onClick={handleSearch} disabled={searchMode === 'name' && !customerName.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  查询
                </Button>
              </div>
            </div>

            {/* 当前查询信息显示 */}
            {(currentCustomerId || currentCustomerName) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>当前查询:</span>
                <Badge variant="secondary">
                  {currentCustomerId ? `ID: ${currentCustomerId}` : `客户: ${currentCustomerName}`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 内容区域 */}
      {(currentCustomerId || currentCustomerName) ? (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="summary">汇总</TabsTrigger>
            <TabsTrigger value="by-install">按装机单</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <SitesSummary 
              customerId={currentCustomerId}
              customerName={currentCustomerName}
            />
          </TabsContent>

          <TabsContent value="by-install" className="space-y-4">
            <SitesByInstall 
              customerId={currentCustomerId}
              customerName={currentCustomerName}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">请选择查询方式并输入相应信息</p>
          <p className="text-sm">支持通过客户ID或客户名称查询站点信息</p>
        </div>
      )}
    </div>
  );
};