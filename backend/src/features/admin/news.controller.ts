import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Controller('api/admin/news')
export class NewsAdminController {
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  list() {
    return {
      data: [],
      pagination: { total: 0, page: 1, pageSize: 20 },
    };
  }
}

