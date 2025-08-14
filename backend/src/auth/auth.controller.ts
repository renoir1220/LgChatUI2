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
import { LoginRequestSchema, LoginResponse } from '@lg/shared';
import type { LoginRequest } from '@lg/shared';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

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
  async getProfile(@Request() req) {
    const user = await this.authService.getUserByUsername(req.user.username);
    return {
      id: user?.id,
      username: user?.username,
      displayName: user?.displayName,
      roles: user?.roles || [],
    };
  }
}
