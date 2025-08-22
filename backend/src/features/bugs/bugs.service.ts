import { Injectable, NotFoundException } from '@nestjs/common';
import { BugsRepository } from './bugs.repository';
import { AppLoggerService } from '../../shared/services/logger.service';
import type {
  Bug,
  CreateBugRequest,
  UpdateBugRequest,
  BugQuery,
  BugListResponse,
} from '@lg/shared';

@Injectable()
export class BugsService {
  constructor(
    private readonly bugsRepository: BugsRepository,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 创建BUG
   */
  async createBug(
    submitterName: string,
    data: CreateBugRequest,
  ): Promise<Bug> {
    this.logger.log('用户提交BUG', {
      submitterName,
      title: data.title,
      contentLength: data.content.length,
      priority: data.priority,
      imageCount: data.images.length,
    });

    try {
      const bug = await this.bugsRepository.create(submitterName, data);

      this.logger.log('BUG提交成功', {
        bugId: bug.id,
        submitterName,
        title: data.title,
      });

      return bug;
    } catch (error) {
      this.logger.error('BUG提交失败', error, {
        submitterName,
        title: data.title,
      });
      throw error;
    }
  }

  /**
   * 查询BUG列表
   */
  async getBugs(query: BugQuery): Promise<BugListResponse> {
    this.logger.log('查询BUG列表', query);

    try {
      const { bugs, total } = await this.bugsRepository.findMany(query);

      this.logger.log('BUG列表查询成功', {
        total,
        count: bugs.length,
        page: query.page,
      });

      return {
        bugs,
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    } catch (error) {
      this.logger.error('查询BUG列表失败', error, query);
      throw error;
    }
  }

  /**
   * 获取BUG详情
   */
  async getBugById(bugId: string): Promise<Bug> {
    this.logger.log('查询BUG详情', { bugId });

    try {
      const bug = await this.bugsRepository.findById(bugId);

      if (!bug) {
        throw new NotFoundException('BUG不存在');
      }

      return bug;
    } catch (error) {
      this.logger.error('查询BUG详情失败', error, { bugId });
      throw error;
    }
  }

  /**
   * 更新BUG（管理员/开发者用）
   */
  async updateBug(
    bugId: string,
    data: UpdateBugRequest,
  ): Promise<void> {
    this.logger.log('更新BUG', {
      bugId,
      updates: Object.keys(data),
    });

    try {
      // 先检查BUG是否存在
      const existingBug = await this.bugsRepository.findById(bugId);
      if (!existingBug) {
        throw new NotFoundException('BUG不存在');
      }

      await this.bugsRepository.update(bugId, data);

      this.logger.log('BUG更新成功', {
        bugId,
        updates: Object.keys(data),
      });
    } catch (error) {
      this.logger.error('更新BUG失败', error, {
        bugId,
        data,
      });
      throw error;
    }
  }

  /**
   * 删除BUG
   */
  async deleteBug(bugId: string): Promise<void> {
    this.logger.log('删除BUG', { bugId });

    try {
      // 先检查BUG是否存在
      const existingBug = await this.bugsRepository.findById(bugId);
      if (!existingBug) {
        throw new NotFoundException('BUG不存在');
      }

      await this.bugsRepository.delete(bugId);

      this.logger.log('BUG删除成功', { bugId });
    } catch (error) {
      this.logger.error('删除BUG失败', error, { bugId });
      throw error;
    }
  }

  /**
   * 分配BUG给开发者
   */
  async assignBug(
    bugId: string,
    assigneeId: string,
    assigneeName: string,
  ): Promise<void> {
    this.logger.log('分配BUG', {
      bugId,
      assigneeId,
      assigneeName,
    });

    try {
      await this.updateBug(bugId, {
        assigneeId,
        assigneeName,
      });

      this.logger.log('BUG分配成功', {
        bugId,
        assigneeId,
        assigneeName,
      });
    } catch (error) {
      this.logger.error('BUG分配失败', error, {
        bugId,
        assigneeId,
        assigneeName,
      });
      throw error;
    }
  }
}