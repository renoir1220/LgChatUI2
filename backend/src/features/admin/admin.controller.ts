import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminConfigService } from './admin.config.service';

@Controller('api/admin')
export class AdminController {
  constructor(private adminConfig: AdminConfigService) {}

  // 登录用户查询自身是否管理员（用于前端菜单显示控制）
  @UseGuards(JwtAuthGuard)
  @Get('permissions/me')
  me(
    @Request() req: ExpressRequest & { user?: { username?: string } },
  ): { isAdmin: boolean } {
    const username = req.user?.username || '';
    return { isAdmin: this.adminConfig.isAdmin(username) };
  }

  // 管理员菜单（仅管理员可访问）
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('menus')
  menus() {
    return [
      { key: 'news', label: '新闻管理' },
    ];
  }

  // 简单联通检查
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('ping')
  ping() {
    return { ok: true, ts: Date.now() };
  }
}
