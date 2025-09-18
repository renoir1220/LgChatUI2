import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from './repositories/users.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import { CrmService } from '../../shared/services/crm.service';
import { LoginResponse } from '../../types';
import type { LoginRequest } from '../../types';
import type { User } from '../../types';
import { CrmLoginCode } from '../../types/crm';

@Injectable()
export class AuthService {
  private readonly logger = new AppLoggerService();
  // 简单的内存缓存：用户名 -> 用户信息（30分钟TTL）
  private userCache: Map<string, { user: User; expiresAt: number }> = new Map();
  private static readonly USER_CACHE_TTL_MS = 30 * 60 * 1000; // 30分钟

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private crmService: CrmService,
  ) {
    this.logger.setContext('AuthService');
  }

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginRequest;

    this.logger.log('开始用户登录验证', {
      username,
      passwordLength: password.length
    });

    // 第一步：CRM验证用户凭据
    const crmResponse = await this.crmService.validateLogin({
      username,
      password
    });

    // 检查CRM验证结果
    if (!crmResponse.Success) {
      const friendlyMessage = CrmService.mapCodeToMessage(crmResponse.Code);
      this.logger.warn('CRM登录验证失败', {
        username,
        code: crmResponse.Code,
        message: crmResponse.Message,
        friendlyMessage
      });
      throw new UnauthorizedException(friendlyMessage);
    }

    // 提取CRM_USER_ID
    const crmUserId = crmResponse.Content?.CRM_USER_ID;
    if (!crmUserId) {
      this.logger.error('CRM验证成功但未返回CRM_USER_ID', undefined, {
        username,
        response: crmResponse
      });
      throw new UnauthorizedException('登录验证失败，请联系管理员');
    }

    this.logger.log('CRM验证成功，使用CRM_USER_ID查询用户信息', {
      username,
      crmUserId: crmUserId.substring(0, 8) + '...'
    });

    // 第二步：使用CRM_USER_ID查询用户详细信息
    const user = await this.usersRepository.findByCrmUserId(crmUserId);
    if (!user) {
      this.logger.warn('CRM_USER_ID在员工数据库中不存在', {
        username,
        crmUserId: crmUserId.substring(0, 8) + '...'
      });
      throw new UnauthorizedException('用户信息不完整，请联系管理员');
    }

    // 第三步：生成JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      crmUserId: user.crmUserId
    };
    const access_token = this.jwtService.sign(payload);

    this.logger.log('用户登录成功', {
      username,
      userId: user.id,
      crmUserId: user.crmUserId?.substring(0, 8) + '...',
      displayName: user.displayName
    });

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roles: user.roles || [],
      },
    };
  }

  async validateUser(username: string) {
    // 优先读取缓存
    const cached = this.userCache.get(username);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    // 为了稳健性，捕获底层仓库错误并返回null（避免影响调用方）
    let user: User | null = null;
    try {
      user = await this.usersRepository.findByUsername(username);
    } catch (e: any) {
      this.logger.error('validateUser 查询失败', e?.stack, {
        username,
        error: e?.message || e
      });
      return null;
    }

    // 仅缓存存在的用户，避免将不存在用户长期缓存
    if (user) {
      this.userCache.set(username, {
        user,
        expiresAt: now + AuthService.USER_CACHE_TTL_MS,
      });
    } else {
      // 不缓存不存在的用户，以便用户被新增后能够及时生效
      this.userCache.delete(username);
    }

    return user; // 如果找不到用户，直接返回null
  }

  async getUserByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
  }

  /**
   * 为外部服务（如Dify）生成长期有效的固定token
   * @param username 用户名
   * @param expiresIn 过期时间，默认10年
   */
  async generateFixedToken(username: string, expiresIn: string = '10y'): Promise<string> {
    // 验证用户存在
    const user = await this.validateUser(username);
    if (!user) {
      throw new UnauthorizedException(`用户 ${username} 不存在`);
    }

    // 生成长期有效的JWT token
    const payload = { 
      sub: user.id, 
      username: user.username,
      type: 'external_service', // 标记为外部服务token
      generated_at: new Date().toISOString()
    };
    
    const token = this.jwtService.sign(payload, { expiresIn });
    
    this.logger.log(`为外部服务生成固定token`, { 
      username, 
      expiresIn,
      tokenLength: token.length 
    });

    return token;
  }
}
