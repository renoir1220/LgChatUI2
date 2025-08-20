import { Controller, Get } from '@nestjs/common';
import { CrmDatabaseService } from './shared/database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: CrmDatabaseService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('db')
  async dbHealth() {
    try {
      await this.db.query('SELECT 1 AS ok');
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
