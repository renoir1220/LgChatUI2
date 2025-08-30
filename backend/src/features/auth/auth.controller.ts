import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestSchema, LoginResponse } from '../../types';
import type { LoginRequest } from '../../types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { UnauthorizedException } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) loginRequest: LoginRequest,
  ): Promise<LoginResponse> {
    return this.authService.login(loginRequest);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(
    @Request() req: ExpressRequest & { user?: { username?: string } },
  ) {
    const username = req.user?.username;
    if (typeof username !== 'string' || username.length === 0) {
      throw new UnauthorizedException('未检测到用户身份');
    }
    const user = await this.authService.getUserByUsername(username);
    return {
      id: user?.id,
      username: user?.username,
      displayName: user?.displayName,
      roles: user?.roles || [],
    };
  }

  /**
   * 为外部服务生成固定token
   * POST /api/auth/generate-fixed-token?username=xxx&expiresIn=10y
   */
  @Post('generate-fixed-token')
  @HttpCode(HttpStatus.OK)
  async generateFixedToken(
    @Query('username') username: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    if (!username) {
      throw new UnauthorizedException('用户名不能为空');
    }

    const token = await this.authService.generateFixedToken(username, expiresIn);
    
    return {
      access_token: token,
      username: username,
      type: 'external_service',
      expires_in: expiresIn || '10y',
      generated_at: new Date().toISOString(),
      usage: 'Use this token in Authorization header: Bearer <token>'
    };
  }
}
