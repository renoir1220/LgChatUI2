import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Newspaper } from 'lucide-react';

export interface SidebarItem {
  key: string;
  label: string;
  to: string;
  icon?: React.ReactNode;
}

interface AdminSidebarProps {
  items: SidebarItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ items }) => {
  const location = useLocation();
  return (
    <aside className="w-[240px] border-r border-border min-h-[calc(100vh-48px)] bg-background">
      <div className="h-10 px-3 flex items-center text-[12px] text-muted-foreground">管理目录</div>
      <Separator className="mx-3" />
      <ScrollArea className="h-[calc(100vh-48px-40px)]">
        <nav className="p-2 space-y-1">
          {items.map((it) => {
            const active = location.pathname.startsWith(it.to);
            return (
              <NavLink
                key={it.key}
                to={it.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {it.icon ?? <Newspaper className="h-4 w-4" />}
                <span className="truncate">{it.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default AdminSidebar;

