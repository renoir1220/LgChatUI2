import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from './repositories/users.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import { LoginResponse } from '../../types';
import type { LoginRequest } from '../../types';
import type { User } from '../../types';

@Injectable()
export class AuthService {
  private readonly logger = new AppLoggerService();
  // 简单的内存缓存：用户名 -> 用户信息（30分钟TTL）
  private userCache: Map<string, { user: User; expiresAt: number }> = new Map();
  private static readonly USER_CACHE_TTL_MS = 30 * 60 * 1000; // 30分钟

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {
    this.logger.setContext('AuthService');
  }

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { username } = loginRequest;

    // 验证：检查用户名是否在员工数据库中存在
    const user = await this.validateUser(username);
    if (!user) {
      throw new UnauthorizedException('用户名不存在，请使用有效的员工姓名');
    }

    // 生成JWT token
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

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

    // 数据库错误会被DatabaseService统一处理并抛出DatabaseException
    // 该异常会直接传播到Controller层，无需在此处捕获
    const user = await this.usersRepository.findByUsername(username);

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
}
