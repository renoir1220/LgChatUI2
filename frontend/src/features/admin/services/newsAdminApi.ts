import { apiDelete, apiGet, apiPost, apiPut, buildApiUrl } from '../../shared/services/api';
import { getToken } from '../../auth/utils/auth';
import type { InfoFeed } from '@/types/infofeed';
import { InfoFeedCategory, InfoFeedStatus } from '@/types/infofeed';

export interface NewsListQuery {
  category?: InfoFeedCategory;
  status?: InfoFeedStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface NewsListResponse {
  data: InfoFeed[];
  pagination: { total: number; page: number; pageSize: number };
}

export type CreateNewsRequest = Partial<InfoFeed> & {
  title: string;
  content: string;
  category?: InfoFeedCategory;
  status?: InfoFeedStatus;
  publish_time?: string;
};

export type UpdateNewsRequest = Partial<CreateNewsRequest>;

export async function listNews(query: NewsListQuery): Promise<NewsListResponse> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', String(query.category));
  if (query.status) params.set('status', String(query.status));
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return apiGet(`/api/admin/news${qs ? `?${qs}` : ''}`);
}

export async function getNews(id: number): Promise<InfoFeed> {
  return apiGet(`/api/admin/news/${id}`);
}

export async function createNews(body: CreateNewsRequest): Promise<InfoFeed> {
  return apiPost(`/api/admin/news`, body);
}

export async function updateNews(id: number, body: UpdateNewsRequest): Promise<InfoFeed> {
  return apiPut(`/api/admin/news/${id}`, body);
}

export async function updateNewsStatus(id: number, status: InfoFeedStatus): Promise<InfoFeed> {
  return apiPut(`/api/admin/news/${id}/status`, { status });
}

export async function deleteNews(id: number): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/admin/news/${id}`);
}

export async function uploadNewsImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);

  const url = await buildApiUrl(`/api/admin/news/upload`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
    } as any,
    body: form,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || '上传失败');
  }
  return resp.json();
}
