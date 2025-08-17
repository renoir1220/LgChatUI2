// 前端认证工具函数

// 存储键名常量
export const TOKEN_KEY = 'access_token';
export const USERNAME_KEY = 'username';

/**
 * 设置认证信息
 */
export function setAuth(token: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * 获取访问令牌
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 获取用户名
 */
export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

/**
 * 清除认证信息
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

/**
 * 检查是否已认证（只检查本地存储）
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  const username = getUsername();
  return !!(token && username);
}

/**
 * 验证token是否有效（通过后端API验证）
 */
export async function validateToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const API_BASE = (import.meta.env?.VITE_API_BASE as string) || '';
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return true;
    } else {
      // Token无效，清除本地认证信息
      clearAuth();
      return false;
    }
  } catch (error) {
    console.error('验证token时出错:', error);
    // 网络错误等情况下，暂时认为token有效，避免频繁登出
    return true;
  }
}