import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  createKnowledgeBase,
  getKnowledgeBase,
  updateKnowledgeBase,
} from '../../services/knowledgeBaseAdminApi';
import { ApiError, showApiError } from '@/features/shared/services/api';

interface FormState {
  kbKey: string;
  name: string;
  description: string;
  apiKey: string;
  apiUrl: string;
  availableUsers: string;
  canSelectModel: boolean;
  enabled: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  kbKey: '',
  name: '',
  description: '',
  apiKey: '',
  apiUrl: '',
  availableUsers: '',
  canSelectModel: false,
  enabled: true,
  sortOrder: '100',
};

const KnowledgeBaseEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const idParam = params.id;
  const isNew = !idParam;

  const [form, setForm] = React.useState<FormState>({ ...emptyForm });
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isNew) return;

    (async () => {
      try {
        const data = await getKnowledgeBase(String(idParam));
        setForm({
          kbKey: data.kbKey,
          name: data.name,
          description: data.description ?? '',
          apiKey: data.apiKey,
          apiUrl: data.apiUrl,
          availableUsers: data.availableUsers ?? '',
          canSelectModel: data.canSelectModel,
          enabled: data.enabled,
          sortOrder: data.sortOrder != null ? String(data.sortOrder) : '',
        });
      } catch (error) {
        showApiError(error, '加载知识库详情失败');
        const message = error instanceof ApiError ? error.message : (error as Error)?.message;
        setErrorMessage(message || '加载知识库详情失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [idParam, isNew]);

  const handleChange = (key: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: 'canSelectModel' | 'enabled') => (value: boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.kbKey.trim()) {
      setErrorMessage('请输入知识库标识');
      return false;
    }
    if (!form.name.trim()) {
      setErrorMessage('请输入知识库名称');
      return false;
    }
    if (!form.apiKey.trim()) {
      setErrorMessage('请输入 API Key');
      return false;
    }
    if (!form.apiUrl.trim()) {
      setErrorMessage('请输入 API 地址');
      return false;
    }
    const sortValue = form.sortOrder.trim();
    if (sortValue && Number.isNaN(Number(sortValue))) {
      setErrorMessage('排序值必须是数字');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!validate()) {
      return;
    }

    setSaving(true);
    const sortValue = form.sortOrder.trim();
    const payload = {
      kbKey: form.kbKey.trim(),
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      apiKey: form.apiKey.trim(),
      apiUrl: form.apiUrl.trim(),
      availableUsers: form.availableUsers.trim() ? form.availableUsers.trim() : undefined,
      canSelectModel: form.canSelectModel,
      enabled: form.enabled,
      sortOrder: sortValue ? Number(sortValue) : undefined,
    };

    try {
      if (isNew) {
        await createKnowledgeBase(payload);
      } else {
        await updateKnowledgeBase(String(idParam), payload);
      }
      navigate('/admin/knowledge-bases');
    } catch (error) {
      showApiError(error, '保存知识库失败');
      const message = error instanceof ApiError ? error.message : (error as Error)?.message;
      setErrorMessage(message || '保存知识库失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            正在加载...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{isNew ? '新建知识库' : '编辑知识库'}</h2>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => navigate('/admin/knowledge-bases')}>
            返回列表
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">KB Key</div>
              <Input
                value={form.kbKey}
                onChange={handleChange('kbKey')}
                placeholder="例：kb_customer"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">名称</div>
              <Input
                value={form.name}
                onChange={handleChange('name')}
                placeholder="请输入名称"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">API Key</div>
              <Input
                value={form.apiKey}
                onChange={handleChange('apiKey')}
                placeholder="请输入 API Key"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">API 地址</div>
              <Input
                value={form.apiUrl}
                onChange={handleChange('apiUrl')}
                placeholder="https://.../v1"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">排序值</div>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={handleChange('sortOrder')}
                placeholder="数值越小越靠前"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">可用用户（逗号分隔，留空为全部）</div>
              <Input
                value={form.availableUsers}
                onChange={handleChange('availableUsers')}
                placeholder="alice,bob"
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">描述</div>
            <Textarea
              value={form.description}
              onChange={handleChange('description')}
              placeholder="请输入功能描述（可选）"
              rows={3}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3">
              <div>
                <div className="text-sm font-medium">允许选择模型</div>
                <div className="text-xs text-muted-foreground">开启后聊天时可以覆盖模型</div>
              </div>
              <Switch
                checked={form.canSelectModel}
                onCheckedChange={handleToggle('canSelectModel')}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3">
              <div>
                <div className="text-sm font-medium">启用</div>
                <div className="text-xs text-muted-foreground">关闭后前台不可见</div>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={handleToggle('enabled')}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseEditorPage;
