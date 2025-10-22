import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AESHelper } from '../utils/aes.util';
import {
  CrmLoginRequest,
  CrmLoginResponse,
  CrmLoginCode,
  ExtendedLoginRequest,
  CrmConfig
} from '../../types/crm';

/**
 * CRM系统接口调用服务
 * 负责与CRM系统进行登录验证通信
 */
@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: CrmConfig;

  constructor() {
    // CRM配置
    const rawApiUrl = process.env.CRM_API_URL || '192.168.200.114:8777';
    const baseUrl = /^https?:\/\//.test(rawApiUrl)
      ? rawApiUrl
      : `https://${rawApiUrl}`;

    this.config = {
      apiUrl: baseUrl,
      timeout: parseInt(process.env.CRM_TIMEOUT || '10000', 10), // 10秒超时
      retryAttempts: parseInt(process.env.CRM_RETRY_ATTEMPTS || '1', 10),
    };

    // 创建HTTP客户端
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 请求拦截器 - 添加日志
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.log(`CRM请求: ${config.method?.toUpperCase()} ${config.url}`, {
          url: config.url,
          method: config.method,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        this.logger.error('CRM请求拦截器错误', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 添加日志
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.log(`CRM响应: ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          success: response.data?.Success,
          code: response.data?.Code,
          message: response.data?.Message,
        });
        return response;
      },
      (error) => {
        this.logger.error('CRM响应错误', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 验证用户登录
   * @param loginRequest 登录请求参数
   * @returns CRM验证结果
   */
  async validateLogin(loginRequest: ExtendedLoginRequest): Promise<CrmLoginResponse> {
    try {
      const { username, password } = loginRequest;

      this.logger.log('开始CRM登录验证', {
        username,
        passwordLength: password.length
      });

      // 开发环境降级策略：检查是否启用CRM绕过模式
      if (this.isDevelopmentFallbackEnabled()) {
        return this.handleDevelopmentFallback(username, password);
      }

      // 严格按照CRM文档生成AES加密Token
      const token = AESHelper.generateCrmToken(username, password);

      // 构造CRM请求
      const crmRequest: CrmLoginRequest = {
        Account: username,
        Token: token,
      };

      // 打印详细的请求信息供CRM提供方检查
      const requestUrl = new URL(
        '/api/User/AICheckLogin',
        this.config.apiUrl,
      ).toString();
      const requestLog = {
        url: requestUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: crmRequest,
      };

      this.logger.log(
        `CRM request payload: ${JSON.stringify(requestLog)}`,
      );

      // 调用CRM登录接口
      const response = await this.callCrmLoginApi(crmRequest);

      this.logger.log('CRM登录验证完成', {
        username,
        success: response.Success,
        code: response.Code,
        message: response.Message,
        响应详情: response,
      });

      return response;
    } catch (error) {
      this.logger.error('CRM登录验证失败', {
        username: loginRequest.username,
        error: error.message,
        stack: error.stack,
      });

      // 检查是否应该降级到开发模式
      if (this.shouldFallbackToDevelopmentMode(error)) {
        this.logger.warn('CRM服务不可用，降级到开发模式', {
          username: loginRequest.username,
          error: error.message
        });
        return this.handleDevelopmentFallback(loginRequest.username, loginRequest.password);
      }

      // 返回系统异常响应
      return {
        Message: `系统异常: ${error.message}`,
        Success: false,
        Code: CrmLoginCode.SYSTEM_ERROR,
        Content: null,
      };
    }
  }

  /**
   * 调用CRM登录API
   * @param request CRM登录请求
   * @returns CRM响应
   */
  private async callCrmLoginApi(request: CrmLoginRequest): Promise<CrmLoginResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        this.logger.log(`CRM API调用尝试 ${attempt}/${this.config.retryAttempts}`, {
          account: request.Account,
          tokenLength: request.Token.length,
          attempt,
        });

        const response: AxiosResponse<CrmLoginResponse> = await this.httpClient.post(
          '/api/User/AICheckLogin',
          request
        );

        return response.data;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`CRM API调用失败 - 尝试 ${attempt}/${this.config.retryAttempts}`, {
          account: request.Account,
          attempt,
          error: error.message,
          status: error.response?.status,
        });

        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < this.config.retryAttempts) {
          await this.delay(1000 * attempt); // 递增延迟
        }
      }
    }

    // 所有重试都失败了
    const errorMessage = lastError ? lastError.message : '未知错误';
    throw new Error(`CRM API调用失败，已重试 ${this.config.retryAttempts} 次: ${errorMessage}`);
  }

  /**
   * 映射CRM响应码为友好消息
   * @param code CRM响应码
   * @returns 友好的错误消息
   */
  static mapCodeToMessage(code: string): string {
    switch (code) {
      case CrmLoginCode.SUCCESS:
        return '登录验证成功';
      case CrmLoginCode.ACCOUNT_OR_TOKEN_EMPTY:
        return '账号或密码不能为空';
      case CrmLoginCode.TOKEN_DECRYPT_FAILED:
        return '登录验证失败，请重试';
      case CrmLoginCode.TOKEN_FORMAT_ERROR:
        return '登录验证失败，请重试';
      case CrmLoginCode.ACCOUNT_MISMATCH:
        return '账号验证失败';
      case CrmLoginCode.TOKEN_EXPIRED:
        return '登录会话已过期，请重试';
      case CrmLoginCode.USER_NOT_EXISTS:
        return '用户不存在，请检查账号';
      case CrmLoginCode.LOGIN_ATTEMPTS_EXCEEDED:
        return '登录失败次数过多，请稍后再试';
      case CrmLoginCode.PASSWORD_INCORRECT:
        return '密码不正确，请检查后重试';
      case CrmLoginCode.SYSTEM_ERROR:
        return '系统异常，请稍后再试';
      default:
        return `未知错误 (${code})`;
    }
  }

  /**
   * 延迟工具方法
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 健康检查 - 测试CRM服务连通性
   * @returns 是否可连通
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 使用简单的HTTP HEAD请求检查连通性
      await this.httpClient.head('/api/User/AICheckLogin', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('CRM健康检查失败', {
        error: error.message,
        config: this.config,
      });
      return false;
    }
  }

  /**
   * 检查是否启用了开发环境降级模式
   * @returns 是否启用开发环境绕过
   */
  private isDevelopmentFallbackEnabled(): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassEnabled = process.env.CRM_BYPASS_ENABLED === 'true';

    return isDevelopment && bypassEnabled;
  }

  /**
   * 检查是否应该降级到开发模式
   * @param error 捕获的错误
   * @returns 是否应该降级
   */
  private shouldFallbackToDevelopmentMode(error: any): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const autoFallback = process.env.CRM_AUTO_FALLBACK === 'true';

    if (!isDevelopment || !autoFallback) {
      return false;
    }

    // 网络相关错误应该降级
    const networkErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENETUNREACH'
    ];

    const errorMessage = error.message || error.code || '';
    return networkErrors.some(networkError =>
      errorMessage.includes(networkError)
    );
  }

  /**
   * 开发环境降级处理
   * @param username 用户名
   * @param password 密码
   * @returns 模拟的CRM响应
   */
  private handleDevelopmentFallback(username: string, password: string): CrmLoginResponse {
    this.logger.warn('🚨 开发环境CRM降级模式已启用', {
      username,
      mode: process.env.CRM_BYPASS_ENABLED ? 'BYPASS' : 'AUTO_FALLBACK',
      environment: process.env.NODE_ENV
    });

    // 检查开发环境用户配置
    const devUsers = this.loadDevelopmentUsers();
    const userConfig = devUsers[username];

    if (!userConfig) {
      this.logger.warn('开发环境用户未配置，拒绝登录', { username, configuredUsers: Object.keys(devUsers) });
      return {
        Message: `开发模式：用户 ${username} 未在开发环境配置中`,
        Success: false,
        Code: CrmLoginCode.USER_NOT_EXISTS,
        Content: null,
      };
    }

    // 简单密码检查（开发环境）
    if (userConfig.password && userConfig.password !== password) {
      this.logger.warn('开发环境密码错误', { username });
      return {
        Message: '开发模式：密码错误',
        Success: false,
        Code: CrmLoginCode.PASSWORD_INCORRECT,
        Content: null,
      };
    }

    // 返回成功响应
    this.logger.log('开发环境登录成功', { username, crmUserId: userConfig.crmUserId });
    return {
      Message: '开发模式登录成功',
      Success: true,
      Code: CrmLoginCode.SUCCESS,
      Content: {
        CRM_USER_ID: userConfig.crmUserId,
        // 可选：添加其他开发需要的字段
        DISPLAY_NAME: userConfig.displayName || username,
        IS_DEV_MODE: true
      },
    };
  }

  /**
   * 加载开发环境用户配置
   * @returns 开发用户配置映射
   */
  private loadDevelopmentUsers(): Record<string, { crmUserId: string; password?: string; displayName?: string }> {
    // 从环境变量读取开发用户配置
    const devUsersEnv = process.env.CRM_DEV_USERS;
    if (devUsersEnv) {
      try {
        return JSON.parse(devUsersEnv);
      } catch (error) {
        this.logger.error('解析CRM_DEV_USERS环境变量失败', error);
      }
    }

    // 默认开发用户配置
    return {
      'ldy': {
        crmUserId: 'DEV_USER_LDY_001',
        password: 'sys123',
        displayName: '开发用户-刘德宇'
      },
      'dev': {
        crmUserId: 'DEV_USER_DEV_001',
        password: 'dev123',
        displayName: '开发用户-测试'
      },
      'admin': {
        crmUserId: 'DEV_USER_ADMIN_001',
        password: 'admin123',
        displayName: '开发用户-管理员'
      }
    };
  }
}
