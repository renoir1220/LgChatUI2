import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getAdminMenus, getIsAdmin, type AdminMenuItem } from '../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import NewsListPage from './news/NewsListPage';
import NewsEditorPage from './news/NewsEditorPage';

// 移除占位，改为实际页面

const AdminShell: React.FC = () => {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [menus, setMenus] = React.useState<AdminMenuItem[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await getIsAdmin();
      if (!mounted) return;
      setIsAdmin(ok);
      if (ok) {
        const ms = await getAdminMenus();
        if (!mounted) return;
        setMenus(ms);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">正在验证权限...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">无权限访问</CardTitle>
            <p className="text-muted-foreground mb-4">请联系管理员将你加入后台管理员名单</p>
            <Badge variant="outline" className="text-xs">
              需要管理员权限
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        items={menus.map((m) => ({ key: m.key, label: m.label, to: `/admin/${m.key}` }))}
      />
      <div className="flex-1">
        <header className="border-b">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6" />
              <div>
                <h1 className="text-lg font-semibold">后台管理</h1>
                <p className="text-sm text-muted-foreground">系统管理控制台</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto">
              管理员
            </Badge>
          </div>
        </header>
        <main className="flex-1 space-y-4 p-8 pt-6">
          <Routes>
            <Route path="" element={<NewsListPage />} />
            <Route path="news" element={<NewsListPage />} />
            <Route path="news/new" element={<NewsEditorPage />} />
            <Route path="news/edit/:id" element={<NewsEditorPage />} />
            <Route path="*" element={<Navigate to="news" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AdminApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<AdminShell />} />
    </Routes>
  );
};

export default AdminApp;
