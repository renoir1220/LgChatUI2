import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BugsService } from './bugs.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateBugRequestSchema,
  UpdateBugRequestSchema,
  BugQuerySchema,
  type CreateBugRequest,
  type UpdateBugRequest,
  type BugQuery,
  type Bug,
  type BugListResponse,
  type FileUploadResponse,
} from '../../types';
import type { Request as ExpressRequest, Express } from 'express';

@Controller('api/bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  /**
   * 创建BUG
   */
  @Post()
  async createBug(
    @Body(new ZodValidationPipe(CreateBugRequestSchema))
    data: CreateBugRequest,
    @Request() req: ExpressRequest & { user?: { username?: string } },
  ): Promise<Bug> {
    const submitterName =
      typeof req.user?.username === 'string' && req.user.username.length > 0
        ? req.user.username
        : '未知用户';
    return this.bugsService.createBug(submitterName, data);
  }

  /**
   * 查询BUG列表
   */
  @Get()
  async getBugs(
    @Query(new ZodValidationPipe(BugQuerySchema))
    query: BugQuery,
  ): Promise<BugListResponse> {
    return this.bugsService.getBugs(query);
  }

  /**
   * 获取BUG详情
   */
  @Get(':id')
  async getBug(@Param('id') bugId: string): Promise<Bug> {
    return this.bugsService.getBugById(bugId);
  }

  /**
   * 更新BUG（管理员/开发者用）
   */
  @Put(':id')
  async updateBug(
    @Param('id') bugId: string,
    @Body(new ZodValidationPipe(UpdateBugRequestSchema))
    data: UpdateBugRequest,
  ): Promise<void> {
    await this.bugsService.updateBug(bugId, data);
  }

  /**
   * 删除BUG
   */
  @Delete(':id')
  async deleteBug(@Param('id') bugId: string): Promise<void> {
    await this.bugsService.deleteBug(bugId);
  }

  /**
   * 分配BUG给开发者
   */
  @Put(':id/assign')
  async assignBug(
    @Param('id') bugId: string,
    @Body() data: { assigneeId: string; assigneeName: string },
  ): Promise<void> {
    await this.bugsService.assignBug(bugId, data.assigneeId, data.assigneeName);
  }

  /**
   * 上传BUG相关图片（最多5张）
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error('只支持图片文件格式: jpg, jpeg, png, gif, webp'),
            false,
          );
        }
      },
    }),
  )
  uploadImages(
    @UploadedFiles() files: any[],
  ): FileUploadResponse[] {
    if (!files || files.length === 0) {
      return [{ success: false, message: '没有上传文件' }];
    }

    if (files.length > 5) {
      return [{ success: false, message: '最多只能上传5张图片' }];
    }

    const results: FileUploadResponse[] = [];

    for (const file of files) {
      try {
        // 这里实现文件存储逻辑
        // 可以保存到本地文件系统、云存储等
        // 示例：生成文件名和路径
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `bug_${timestamp}_${randomStr}.${fileExtension}`;

        // 这里应该实现实际的文件保存逻辑
        // const filePath = path.join('uploads', 'bugs', fileName);
        // await fs.writeFile(filePath, file.buffer);

        // 返回文件URL（这里使用示例URL）
        const fileUrl = `/uploads/bugs/${fileName}`;

        results.push({
          success: true,
          url: fileUrl,
          message: '上传成功',
        });
      } catch (error) {
        results.push({
          success: false,
          message: `文件 ${file.originalname} 上传失败: ${error.message}`,
        });
      }
    }

    return results;
  }
}
