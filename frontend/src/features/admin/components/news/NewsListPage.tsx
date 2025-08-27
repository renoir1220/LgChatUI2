import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { InfoFeed } from '@/types/infofeed';
import { InfoFeedCategory, InfoFeedStatus } from '@/types/infofeed';
import { deleteNews, listNews, updateNewsStatus } from '../../services/newsAdminApi';
import { showApiError } from '@/features/shared/services/api';

const statusOptions = [
  { value: InfoFeedStatus.DRAFT, label: '草稿' },
  { value: InfoFeedStatus.PUBLISHED, label: '已发布' },
  { value: InfoFeedStatus.ARCHIVED, label: '已归档' },
];

const NewsListPage: React.FC = () => {
  const nav = useNavigate();
  const [keyword, setKeyword] = React.useState('');
  const [statuses, setStatuses] = React.useState<InfoFeedStatus[]>([]);
  const [categories, setCategories] = React.useState<InfoFeedCategory[]>([]);
  const [catOpen, setCatOpen] = React.useState(false);
  const [statOpen, setStatOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<InfoFeed[]>([]);
  const [total, setTotal] = React.useState(0);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNews({
        category: categories.length ? (categories.join(',') as any) : undefined,
        keyword: keyword || undefined,
        status: statuses.length ? (statuses.join(',') as any) : undefined,
        page: 1,
        pageSize: 20,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      showApiError(e, '加载新闻失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, statuses, categories]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDelete = async (id: number) => {
    if (!confirm('确定删除该新闻吗？')) return;
    try {
      await deleteNews(id);
      fetchData();
    } catch (e) {
      showApiError(e, '删除失败');
    }
  };

  const onChangeStatus = async (id: number, s: InfoFeedStatus) => {
    try {
      await updateNewsStatus(id, s);
      fetchData();
    } catch (e) {
      showApiError(e, '更新状态失败');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">新闻管理</h2>
        <Button onClick={() => nav('/admin/news/new')}>新建新闻</Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="搜索标题关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-[240px]"
            />
            {/* 分类多选 */}
            <DropdownMenu open={catOpen} onOpenChange={setCatOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  分类：{categories.length ? `${categories.length} 项` : '全部'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>分类</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { v: InfoFeedCategory.NEWS, t: '新闻' },
                  { v: InfoFeedCategory.FEATURES, t: '功能' },
                  { v: InfoFeedCategory.KNOWLEDGE, t: '知识' },
                  { v: InfoFeedCategory.RELATED, t: '相关' },
                ].map((it) => (
                  <DropdownMenuCheckboxItem
                    key={it.v}
                    checked={categories.includes(it.v)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(ck) => {
                      setCategories((prev) =>
                        ck ? Array.from(new Set([...prev, it.v])) : prev.filter((x) => x !== it.v),
                      );
                    }}
                  >
                    {it.t}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategories([InfoFeedCategory.NEWS, InfoFeedCategory.FEATURES, InfoFeedCategory.KNOWLEDGE, InfoFeedCategory.RELATED])}
                  >
                    全选
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCategories([])}>
                    清空
                  </Button>
                  <div className="ml-auto">
                    <Button size="sm" onClick={() => setCatOpen(false)}>完成</Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 状态多选 */}
            <DropdownMenu open={statOpen} onOpenChange={setStatOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  状态：{statuses.length ? `${statuses.length} 项` : '全部'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>状态</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={statuses.includes(o.value)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(ck) => {
                      setStatuses((prev) =>
                        ck ? Array.from(new Set([...prev, o.value])) : prev.filter((x) => x !== o.value),
                      );
                    }}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatuses([InfoFeedStatus.DRAFT, InfoFeedStatus.PUBLISHED, InfoFeedStatus.ARCHIVED])}
                  >
                    全选
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStatuses([])}>
                    清空
                  </Button>
                  <div className="ml-auto">
                    <Button size="sm" onClick={() => setStatOpen(false)}>完成</Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" onClick={fetchData} disabled={loading}>
              {loading ? '加载中…' : '刷新'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">共 {total} 条</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 w-[96px]">缩略图</th>
                  <th className="py-2 pr-3">标题</th>
                  <th className="py-2 pr-3 w-[80px]">置顶</th>
                  <th className="py-2 pr-3 w-[120px]">状态</th>
                  <th className="py-2 pr-3 w-[160px]">发布时间</th>
                  <th className="py-2 pr-3 w-[160px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-accent/40">
                    <td className="py-2 pr-3">
                      {r.thumbnail_url ? (
                        <img
                          src={r.thumbnail_url}
                          alt={r.title}
                          className="w-[88px] h-[56px] object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-[88px] h-[56px] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          无
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{r.summary}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {r.is_pinned ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          📌 置顶
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">普通</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <Select value={r.status} onValueChange={(v) => onChangeStatus(r.id, v as InfoFeedStatus)}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-3">{new Date(r.publish_time).toLocaleString()}</td>
                    <td className="py-2 pr-3 space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => nav(`/admin/news/edit/${r.id}`)}>
                        编辑
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsListPage;
