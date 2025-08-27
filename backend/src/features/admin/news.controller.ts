import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { NewsAdminService } from './news.service';
import { CreateNewsDto, ListNewsQueryDto, UpdateNewsDto, UpdateStatusDto } from './dto/news.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/admin/news')
export class NewsAdminController {
  constructor(private readonly service: NewsAdminService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async list(@Query() q: ListNewsQueryDto) {
    return this.service.list(q);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.service.detail(Number(id));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() dto: CreateNewsDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.service.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(Number(id), dto.status);
  }

  // 简单的图片上传：保存到 uploads/news/yyyy/mm 下
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const now = new Date();
          const year = String(now.getFullYear());
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const dir = path.resolve(process.cwd(), 'uploads', 'news', year, month);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
          const ts = Date.now();
          cb(null, `${base}_${ts}${ext || '.bin'}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.originalname);
        cb(ok ? null : new Error('不支持的文件类型'), ok);
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) return { error: '未接收到文件' };
    const rel = path
      .relative(path.resolve(process.cwd()), file.path)
      .split(path.sep)
      .join('/');
    // 将相对 backend 根目录的路径映射为以 /uploads 开头的URL
    const idx = rel.indexOf('uploads/');
    const url = '/' + (idx >= 0 ? rel.slice(idx) : rel);
    return { url };
  }
}
