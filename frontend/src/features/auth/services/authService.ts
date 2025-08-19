// 认证服务
import { configService } from '../../shared/services/configService';

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    username: string;
    displayName: string;
  };
}

class AuthService {
  private async getBaseUrl(): Promise<string> {
    const apiBase = await configService.getApiBase();
    // 确保API基础URL包含/api路径
    return apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;
  }
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // 登录
  async login(username: string): Promise<LoginResponse> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`登录失败: ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    
    // 保存token和用户信息
    localStorage.setItem(this.tokenKey, data.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    
    return data;
  }

  // 登出
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // 获取token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 获取用户信息
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // 获取认证头
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();