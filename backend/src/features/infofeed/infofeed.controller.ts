/**
 * 信息流API控制器
 *
 * 处理信息流相关的HTTP请求，包括CRUD操作、点赞、评论等功能
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InfoFeedService } from './infofeed.service';
import {
  InfoFeedListQueryDto,
  CreateInfoFeedDto,
  UpdateInfoFeedDto,
  CreateCommentDto,
  InfoFeedDetailParamsDto,
  CommentListQueryDto,
  LikeActionParamsDto,
  CommentLikeActionParamsDto,
  ReplyCommentDto,
} from './dto/infofeed.dto';
import { InfoFeedApiResponse } from '../../types/infofeed';
import { extractUserIdFromRequest } from '../../shared/utils/user.utils';

@Controller('api/infofeed')
export class InfoFeedController {
  constructor(private readonly infoFeedService: InfoFeedService) {}

  /**
   * 获取信息流列表
   * GET /api/infofeed?category=all&page=1&limit=20
   */
  @Get()
  async getInfoFeedList(
    @Query() query: InfoFeedListQueryDto,
    @Request() req?: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      // 获取当前用户ID（如果已登录）
      const currentUserId = req?.user?.username
        ? extractUserIdFromRequest(req)
        : undefined;

      const result = await this.infoFeedService.getInfoFeedList(
        query,
        currentUserId,
      );

      return {
        success: true,
        data: result,
        message: '获取信息流列表成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '获取信息流列表失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取信息流详情
   * GET /api/infofeed/:id
   */
  @Get(':id')
  async getInfoFeedDetail(
    @Param() params: InfoFeedDetailParamsDto,
    @Request() req?: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const currentUserId = req?.user?.username
        ? extractUserIdFromRequest(req)
        : undefined;

      const result = await this.infoFeedService.getInfoFeedDetail(
        params.id,
        currentUserId,
      );

      return {
        success: true,
        data: result,
        message: '获取信息流详情成功',
      };
    } catch (error) {
      const status = error.message?.includes('不存在')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '获取信息流详情失败',
        },
        status,
      );
    }
  }

  /**
   * 创建信息流（需要登录）
   * POST /api/infofeed
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createInfoFeed(
    @Body() createDto: CreateInfoFeedDto,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const authorId = extractUserIdFromRequest(req);

      const result = await this.infoFeedService.createInfoFeed(
        createDto,
        authorId,
      );

      return {
        success: true,
        data: result,
        message: '创建信息流成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '创建信息流失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新信息流（需要登录）
   * PUT /api/infofeed/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateInfoFeed(
    @Param() params: InfoFeedDetailParamsDto,
    @Body() updateDto: UpdateInfoFeedDto,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const currentUserId = extractUserIdFromRequest(req);

      const result = await this.infoFeedService.updateInfoFeed(
        params.id,
        updateDto,
        currentUserId,
      );

      return {
        success: true,
        data: result,
        message: '更新信息流成功',
      };
    } catch (error) {
      const status = error.message?.includes('不存在')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '更新信息流失败',
        },
        status,
      );
    }
  }

  /**
   * 删除信息流（需要登录）
   * DELETE /api/infofeed/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteInfoFeed(
    @Param() params: InfoFeedDetailParamsDto,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const currentUserId = extractUserIdFromRequest(req);

      const result = await this.infoFeedService.deleteInfoFeed(
        params.id,
        currentUserId,
      );

      return {
        success: true,
        data: { deleted: result },
        message: '删除信息流成功',
      };
    } catch (error) {
      const status = error.message?.includes('不存在')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '删除信息流失败',
        },
        status,
      );
    }
  }

  /**
   * 信息流点赞/取消点赞（需要登录）
   * POST /api/infofeed/:id/like
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleInfoFeedLike(
    @Param() params: LikeActionParamsDto,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const userId = extractUserIdFromRequest(req);

      const result = await this.infoFeedService.toggleInfoFeedLike(
        params.id,
        userId,
      );

      return {
        success: true,
        data: result,
        message: result.is_liked ? '点赞成功' : '取消点赞成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '点赞操作失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取信息流评论列表
   * GET /api/infofeed/:id/comments?page=1&limit=20
   */
  @Get(':id/comments')
  async getCommentList(
    @Param() params: InfoFeedDetailParamsDto,
    @Query() query: Omit<CommentListQueryDto, 'feed_id'>,
    @Request() req?: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const currentUserId = req?.user?.id;
      const fullQuery: CommentListQueryDto = {
        ...query,
        feed_id: Number(params.id),
      };

      const result = await this.infoFeedService.getCommentList(
        fullQuery,
        currentUserId,
      );

      return {
        success: true,
        data: result,
        message: '获取评论列表成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '获取评论列表失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 添加评论（需要登录）
   * POST /api/infofeed/:id/comments
   */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param() params: InfoFeedDetailParamsDto,
    @Body() createDto: Omit<CreateCommentDto, 'feed_id'>,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const userId = extractUserIdFromRequest(req);
      const fullCreateDto: CreateCommentDto = {
        ...createDto,
        feed_id: params.id,
      };

      const result = await this.infoFeedService.createComment(
        fullCreateDto,
        userId,
      );

      return {
        success: true,
        data: result,
        message: '添加评论成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '添加评论失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 评论点赞/取消点赞（需要登录）
   * POST /api/infofeed/comments/:comment_id/like
   */
  @Post('comments/:comment_id/like')
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(
    @Param() params: CommentLikeActionParamsDto,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const userId = extractUserIdFromRequest(req);

      const result = await this.infoFeedService.toggleCommentLike(
        params.comment_id,
        userId,
      );

      return {
        success: true,
        data: result,
        message: result.is_liked ? '评论点赞成功' : '取消评论点赞成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '评论点赞操作失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 回复评论（需要登录）
   * POST /api/infofeed/comments/:comment_id/reply
   */
  @Post('comments/:comment_id/reply')
  @UseGuards(JwtAuthGuard)
  async replyComment(
    @Param() params: CommentLikeActionParamsDto,
    @Body() replyDto: Omit<ReplyCommentDto, 'comment_id'>,
    @Request() req: any,
  ): Promise<InfoFeedApiResponse> {
    try {
      const userId = req.user.id;
      const result = await this.infoFeedService.replyToComment(
        params.comment_id,
        replyDto.content,
        userId,
      );

      return {
        success: true,
        data: result,
        message: '回复评论成功',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: '回复评论失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
