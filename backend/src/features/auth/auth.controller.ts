import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
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
}
