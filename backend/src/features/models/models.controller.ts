import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModelsRepository } from './models.repository';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ModelsController {
  constructor(private readonly repo: ModelsRepository) {}

  // GET /api/models - 获取当前用户可用模型列表
  @Get('models')
  async list(@Request() req: any) {
    const username = req.user?.username as string | undefined;
    const list = await this.repo.findEnabledByUser(username);
    // 仅返回必要字段
    return list.map((m) => ({
      id: m.id,
      provider: m.provider,
      modelName: m.modelName,
      displayName: m.displayName,
      isDefault: m.isDefault,
    }));
  }
}
