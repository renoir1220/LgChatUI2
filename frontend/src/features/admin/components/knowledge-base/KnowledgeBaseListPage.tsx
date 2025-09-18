import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  listKnowledgeBases,
  deleteKnowledgeBase,
  type KnowledgeBaseAdminItem,
} from '../../services/knowledgeBaseAdminApi';
import { showApiError } from '@/features/shared/services/api';

const KnowledgeBaseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<KnowledgeBaseAdminItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listKnowledgeBases();
      setItems(data ?? []);
    } catch (error) {
      showApiError(error, '加载知识库列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: KnowledgeBaseAdminItem) => {
    if (!confirm(`确定删除知识库 “${item.name}” 吗？`)) {
      return;
    }
    try {
      await deleteKnowledgeBase(item.id);
      await fetchData();
    } catch (error) {
      showApiError(error, '删除知识库失败');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">知识库管理</h2>
          <p className="text-sm text-muted-foreground">维护 AI_KNOWLEDGE_BASES 配置信息</p>
        </div>
        <Button onClick={() => navigate('/admin/knowledge-bases/new')}>新建知识库</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">知识库列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">正在加载...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3">名称</th>
                    <th className="py-2 pr-3">KB Key</th>
                    <th className="py-2 pr-3">API 地址</th>
                    <th className="py-2 pr-3">允许选模型</th>
                    <th className="py-2 pr-3">启用状态</th>
                    <th className="py-2 pr-3">可用用户</th>
                    <th className="py-2 pr-3 text-right">排序值</th>
                    <th className="py-2 pr-3">更新时间</th>
                    <th className="py-2 pr-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 hover:bg-accent/40">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description || '无描述'}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{item.kbKey}</td>
                      <td className="py-2 pr-3 max-w-[260px]">
                        <div className="truncate" title={item.apiUrl}>
                          {item.apiUrl}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {item.canSelectModel ? (
                          <Badge variant="secondary">允许</Badge>
                        ) : (
                          <Badge variant="outline">禁止</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {item.enabled ? (
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 border-transparent">
                            已启用
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-dashed text-muted-foreground">
                            已停用
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 max-w-[220px]">
                        {item.availableUsers ? (
                          <span className="block truncate" title={item.availableUsers}>
                            {item.availableUsers}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">全部用户</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">{item.sortOrder}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/admin/knowledge-bases/edit/${item.id}`)}
                        >
                          编辑
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseListPage;
