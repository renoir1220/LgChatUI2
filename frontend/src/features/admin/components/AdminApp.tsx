import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getAdminMenus, getIsAdmin, type AdminMenuItem } from '../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
