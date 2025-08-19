import { getToken } from '../../auth/utils/auth'
import { configService } from './configService'
import { message } from 'antd'

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public path: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 从响应中提取错误信息
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      // NestJS错误格式
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          return errorData.message.join(', ');
        }
        return errorData.message;
      }
      // 其他JSON错误格式
      if (errorData.error) {
        return errorData.error;
      }
    }
    
    // 尝试获取文本响应
    const text = await response.text();
    if (text) {
      return text;
    }
  } catch (e) {
    // 解析错误时使用默认错误信息
  }
  
  // 根据状态码返回友好的错误信息
  return getStatusErrorMessage(response.status);
}

/**
 * 根据HTTP状态码返回友好的错误信息
 */
function getStatusErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return '请求参数错误';
    case 401:
      return '未授权访问，请重新登录';
    case 403:
      return '权限不足，无法执行此操作';
    case 404:
      return '请求的资源不存在';
    case 409:
      return '资源冲突，请刷新后重试';
    case 422:
      return '数据验证失败';
    case 500:
      return '服务器内部错误，请稍后重试';
    case 502:
      return '网关错误，请检查网络连接';
    case 503:
      return '服务暂时不可用，请稍后重试';
    default:
      return `请求失败 (${status})`;
  }
}

/**
 * 显示API错误信息
 */
export function showApiError(error: unknown, defaultMessage = '操作失败') {
  if (error instanceof ApiError) {
    message.error(error.message);
  } else if (error instanceof Error) {
    message.error(error.message || defaultMessage);
  } else {
    message.error(defaultMessage);
  }
}

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
  if (!resp.ok) {
    const errorMessage = await getErrorMessage(resp);
    throw new ApiError(resp.status, errorMessage, path);
  }
  return resp.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const resp = await apiFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const errorMessage = await getErrorMessage(resp);
    throw new ApiError(resp.status, errorMessage, path);
  }
  return resp.json() as Promise<T>;
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  const resp = await apiFetch(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const errorMessage = await getErrorMessage(resp);
    throw new ApiError(resp.status, errorMessage, path);
  }
  
  // 处理空响应体的情况
  const text = await resp.text();
  return text ? JSON.parse(text) : {} as T;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const resp = await apiFetch(path, { method: 'DELETE' });
  if (!resp.ok) {
    const errorMessage = await getErrorMessage(resp);
    throw new ApiError(resp.status, errorMessage, path);
  }
  return resp.json() as Promise<T>;
}

