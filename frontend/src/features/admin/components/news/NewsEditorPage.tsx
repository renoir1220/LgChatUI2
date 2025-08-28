import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ReactMarkdown from 'react-markdown';
import '@/features/infofeed/components/feed-markdown.css';
import { InfoFeedCategory, InfoFeedStatus } from '@/types/infofeed';
import { createNews, getNews, updateNews, uploadNewsImage } from '../../services/newsAdminApi';
import { showApiError } from '@/features/shared/services/api';

const statusOptions = [
  { value: InfoFeedStatus.DRAFT, label: '草稿' },
  { value: InfoFeedStatus.PUBLISHED, label: '已发布' },
  { value: InfoFeedStatus.ARCHIVED, label: '已归档' },
];

const NewsEditorPage: React.FC = () => {
  const nav = useNavigate();
  const params = useParams();
  const idParam = params.id;
  const isNew = !idParam;

  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(!isNew);
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [content, setContent] = React.useState('');
  const [status, setStatus] = React.useState<InfoFeedStatus>(InfoFeedStatus.DRAFT);
  const [publishTime, setPublishTime] = React.useState<string>('');
  const [isPinned, setIsPinned] = React.useState(false);

  React.useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const data = await getNews(Number(idParam));
        setTitle(data.title || '');
        setSummary(data.summary || '');
        setContent(data.content || '');
        setStatus(data.status);
        setIsPinned(data.is_pinned || false);
        // 转换为 datetime-local 可用的格式
        const dt = new Date(data.publish_time);
        const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setPublishTime(iso);
      } catch (e) {
        showApiError(e, '加载详情失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [idParam, isNew]);

  const onSave = async () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content,
        category: InfoFeedCategory.NEWS,
        status,
        publish_time: publishTime ? new Date(publishTime).toISOString() : undefined,
        is_pinned: isPinned,
      };
      if (isNew) {
        await createNews(body);
      } else {
        await updateNews(Number(idParam), body);
      }
      nav('/admin/news');
    } catch (e) {
      showApiError(e, '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 保存对输入元素的引用，避免异步操作后引用丢失
    const inputElement = e.currentTarget;
    
    try {
      const { url } = await uploadNewsImage(file);
      // 在光标处插入Markdown图片语法
      const md = `\n\n![图片描述](${url})\n\n`;
      setContent((prev) => prev + md);
    } catch (err) {
      showApiError(err, '图片上传失败');
    } finally {
      // 检查元素是否仍然存在后再清空值
      if (inputElement && inputElement.value !== undefined) {
        inputElement.value = '';
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{isNew ? '新建新闻' : '编辑新闻'}</h2>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => nav('/admin/news')}>返回列表</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? '保存中…' : '保存'}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基础信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">标题</div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入标题" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">状态</div>
                <Select value={status} onValueChange={(v) => setStatus(v as InfoFeedStatus)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">置顶</div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isPinned}
                    onCheckedChange={setIsPinned}
                    id="pinned-switch"
                  />
                  <label 
                    htmlFor="pinned-switch" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {isPinned ? '已置顶' : '普通'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">发布时间</div>
                <Input type="datetime-local" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">摘要</div>
                <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="可选，展示在列表的简要说明" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">内容（Markdown）</div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground inline-flex items-center gap-2 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadImage} />
                    <span className="px-2 py-1 rounded border border-border hover:bg-accent/50">插入图片</span>
                  </label>
                </div>
                <Textarea rows={18} value={content} onChange={(e) => setContent(e.target.value)} placeholder="支持 Markdown 语法" />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">预览</div>
              <div className="prose prose-slate max-w-none feed-markdown border rounded-md p-4">
                <ReactMarkdown>{content || '（内容预览）'}</ReactMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsEditorPage;
