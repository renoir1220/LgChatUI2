import { getToken } from '../../auth/utils/auth'
import { configService } from './configService'

// 动态获取API基础URL
let cachedApiBase: string | null = null;

export async function getApiBase(): Promise<string> {
  if (cachedApiBase) {
    return cachedApiBase;
  }
  
  cachedApiBase = await configService.getApiBase();
  return cachedApiBase;
}

// 为了向后兼容，保留同步版本（使用环境变量作为后备）
export const API_BASE = (import.meta.env?.VITE_API_BASE as string) || ''

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const apiBase = await getApiBase();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // 自动添加Bearer token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`${apiBase}${path}`, { 
    ...options, 
    headers 
  });
  
  return resp;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const resp = await apiFetch(path, { method: 'GET' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const resp = await apiFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  const resp = await apiFetch(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  
  // 处理空响应体的情况
  const text = await resp.text();
  return text ? JSON.parse(text) : {} as T;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const resp = await apiFetch(path, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<T>;
}

