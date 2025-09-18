import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { KnowledgeBaseAdminService } from './knowledge-base-admin.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';

@Controller('api/admin/knowledge-bases')
@UseGuards(JwtAuthGuard, AdminGuard)
export class KnowledgeBaseAdminController {
  constructor(private readonly service: KnowledgeBaseAdminService) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Post()
  async create(@Body() dto: CreateKnowledgeBaseDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
