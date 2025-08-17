import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DifyService } from '../../shared/services/dify.service';

@UseGuards(JwtAuthGuard)
@Controller('api/files')
export class FilesController {
  constructor(private readonly dify: DifyService) {}

  // GET /api/files/:id/preview?kb=<knowledgeBaseId>
  @Get(':id/preview')
  async preview(
    @Param('id') id: string,
    @Query('kb') kb: string | undefined,
    @Res() res: express.Response,
  ) {
    try {
      const stream = await this.dify.fetchFilePreviewStream(id, kb);
      // 透传常见头部（简化处理）
      res.setHeader('Content-Type', 'image/*');
      stream.pipe(res);
    } catch (e: any) {
      const status = e?.status || 502;
      res.status(status).json({
        code: 'file_proxy_error',
        status,
        message: 'Failed to fetch file preview',
      });
    }
  }
}
