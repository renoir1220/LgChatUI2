import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Newspaper, BarChart3, Settings, Users, BookOpen, MessageSquare } from 'lucide-react';

export interface SidebarItem {
  key: string;
  label: string;
  to: string;
  icon?: React.ReactNode;
}

interface AdminSidebarProps {
  items: SidebarItem[];
}

// 菜单图标映射
const getMenuIcon = (key: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    news: <Newspaper className="h-4 w-4" />,
    analytics: <BarChart3 className="h-4 w-4" />,
    users: <Users className="h-4 w-4" />,
    settings: <Settings className="h-4 w-4" />,
    'knowledge-bases': <BookOpen className="h-4 w-4" />,
    conversations: <MessageSquare className="h-4 w-4" />,
  };
  return iconMap[key] || <Newspaper className="h-4 w-4" />;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({ items }) => {
  const location = useLocation();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-lg">管理台</span>
          </div>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    active
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {getMenuIcon(item.key)}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">系统正常</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
