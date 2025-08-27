import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminConfigService } from './admin.config.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private adminConfig: AdminConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const username: string | undefined = req.user?.username;
    if (!this.adminConfig.isAdmin(username || null)) {
      throw new ForbiddenException('需要管理员权限');
    }
    return true;
  }
}

