import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getAdminMenus, getIsAdmin, type AdminMenuItem } from '../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminSidebar from './AdminSidebar';

const NewsAdminPage: React.FC = () => {
  return (
    <div className="p-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>新闻管理</CardTitle>
          <CardDescription>占位页面：后续在此实现新闻的增删改查与发布。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            暂无数据。稍后将在此展示新闻列表与操作按钮。
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
    return <div className="p-6 text-sm text-muted-foreground">加载中…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-semibold mb-1">无权限访问</h2>
          <p className="text-muted-foreground">请联系管理员将你加入后台管理员名单</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部栏 */}
      <div className="h-12 border-b border-border flex items-center px-4">
        <div className="font-semibold">后台管理</div>
      </div>

      {/* 主布局 */}
      <div className="flex">
        <AdminSidebar
          items={menus.map((m) => ({ key: m.key, label: m.label, to: `/admin/${m.key}` }))}
        />

        {/* 内容区 */}
        <main className="flex-1 min-h-[calc(100vh-48px)]">
          <Routes>
            <Route path="news" element={<NewsAdminPage />} />
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
