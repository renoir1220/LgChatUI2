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
    this.config = {
      apiUrl: process.env.CRM_API_URL || '192.168.200.114:8777',
      timeout: parseInt(process.env.CRM_TIMEOUT || '10000', 10), // 10秒超时
      retryAttempts: parseInt(process.env.CRM_RETRY_ATTEMPTS || '1', 10),
    };

    // 创建HTTP客户端
    this.httpClient = axios.create({
      baseURL: `http://${this.config.apiUrl}`,
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

      // 严格按照CRM文档生成AES加密Token
      const token = AESHelper.generateCrmToken(username, password);

      // 构造CRM请求
      const crmRequest: CrmLoginRequest = {
        Account: username,
        Token: token,
      };

      // 打印详细的请求信息供CRM提供方检查
      this.logger.log('=== CRM请求详细信息 ===', {
        请求地址: `http://${this.config.apiUrl}/api/User/AICheckLogin`,
        请求方法: 'POST',
        请求头: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        请求体: crmRequest,
        请求体JSON: JSON.stringify(crmRequest, null, 2),
      });

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
}