import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from './repositories/users.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import { LoginResponse } from '@lg/shared';
import type { LoginRequest } from '@lg/shared';

@Injectable()
export class AuthService {
  private readonly logger = new AppLoggerService();

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
    // 数据库错误会被DatabaseService统一处理并抛出DatabaseException
    // 该异常会直接传播到Controller层，无需在此处捕获
    const user = await this.usersRepository.findByUsername(username);
    return user; // 如果找不到用户，直接返回null
  }

  async getUserByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
  }
}
