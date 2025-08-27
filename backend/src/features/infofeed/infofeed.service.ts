/**
 * 信息流业务逻辑服务
 *
 * 处理信息流相关的所有业务逻辑，包括CRUD操作、点赞、评论等功能
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppLoggerService } from '../../shared/services/logger.service';
import {
  InfoFeed,
  InfoFeedComment,
  InfoFeedListQuery,
  InfoFeedDetailResponse,
  InfoFeedCommentResponse,
  InfoFeedLikeResponse,
  PaginatedResponse,
  InfoFeedCategory,
  ThumbnailExtractionResult,
} from '../../types/infofeed';
import { CreateInfoFeedDto, UpdateInfoFeedDto, CreateCommentDto, InfoFeedListQueryDto, CommentListQueryDto } from './dto/infofeed.dto';
import { InfoFeedsRepository } from './repositories/feeds.repository';
import { InfoFeedCommentsRepository } from './repositories/comments.repository';
import { InfoFeedLikesRepository } from './repositories/likes.repository';

@Injectable()
export class InfoFeedService {
  constructor(
    private readonly feedsRepo: InfoFeedsRepository,
    private readonly commentsRepo: InfoFeedCommentsRepository,
    private readonly likesRepo: InfoFeedLikesRepository,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * 获取信息流列表
   */
  async getInfoFeedList(
    query: InfoFeedListQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResponse<InfoFeed>> {
    const { category, user_id, page: rawPage = 1, limit: rawLimit = 20, order_by = 'publish_time', order_direction = 'DESC' } = query;
    const page = typeof rawPage === 'string' ? parseInt(rawPage) : rawPage;
    const limit = typeof rawLimit === 'string' ? parseInt(rawLimit) : rawLimit;
    try {
      const [rawList, total] = await Promise.all([
        this.feedsRepo.list({
          category,
          user_id,
          page,
          limit,
          order_by,
          order_direction,
          currentUserId,
        }),
        this.feedsRepo.count({ category, user_id, currentUserId }),
      ]);

      // 补充缩略图：若DB中未提供，则从正文提取首图作为缩略图（仅用于展示，不修改DB）
      const listResult = rawList.map((it) => {
        if (!it.thumbnail_url && it.content) {
          const thumb = this.extractThumbnailFromContent(it.content);
          if (thumb?.url) return { ...it, thumbnail_url: thumb.url } as InfoFeed;
        }
        return it as InfoFeed;
      });

      const totalPages = Math.ceil(total / limit);
      this.logger.log(`获取信息流列表成功 - category: ${category}, page: ${page}, limit: ${limit}, total: ${total}, resultCount: ${listResult.length}`);
      return {
        data: listResult,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        '获取信息流列表失败',
        error.stack || error.message || String(error),
      );
      throw error;
    }
  }

  /**
   * 获取信息流详情
   */
  async getInfoFeedDetail(
    id: number,
    currentUserId?: string,
  ): Promise<InfoFeedDetailResponse> {
    try {
      const feed = await this.feedsRepo.getPublishedById(id);
      if (!feed) {
        throw new NotFoundException('信息流不存在或已下线');
      }
      // 检查当前用户是否点赞
      let isLiked = false;
      if (currentUserId) {
        isLiked = await this.likesRepo.existsFeedLike(id, currentUserId);
      }

      await this.incrementViewCount(id);

      this.logger.log(
        `获取信息流详情成功 - id: ${id}, userId: ${currentUserId}`,
      );

      return {
        ...feed,
        is_liked: isLiked,
      };
    } catch (error) {
      this.logger.error(
        `获取信息流详情失败 - id: ${id}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 创建信息流
   */
  async createInfoFeed(
    createDto: CreateInfoFeedDto,
    authorId: string,
  ): Promise<InfoFeed> {
    try {
      // 从内容中提取缩略图（如果未提供）
      let thumbnailUrl = createDto.thumbnail_url;
      if (!thumbnailUrl) {
        const extracted = this.extractThumbnailFromContent(createDto.content);
        thumbnailUrl = extracted.url;
      }

      const publishTime = createDto.publish_time
        ? new Date(createDto.publish_time)
        : new Date();

      const result = await this.feedsRepo.create({
        title: createDto.title,
        content: createDto.content,
        summary: createDto.summary ?? null,
        category: createDto.category,
        thumbnail_url: thumbnailUrl ?? null,
        source: createDto.source,
        author_id: authorId,
        is_pinned: createDto.is_pinned,
        status: createDto.status,
        publish_time: publishTime,
      });

      this.logger.log(`创建信息流成功 - id: ${result.id}, title: ${createDto.title}, authorId: ${authorId}`);
      return result;
    } catch (error) {
      this.logger.error(
        '创建信息流失败',
        error.stack || error.message || String(error),
      );
      throw error;
    }
  }

  /**
   * 更新信息流
   */
  async updateInfoFeed(
    id: number,
    updateDto: UpdateInfoFeedDto,
    currentUserId: string,
  ): Promise<InfoFeed> {
    try {
      // 检查存在性（权限校验可在此扩展）
      const existingFeed = await this.getInfoFeedById(id);
      if (!existingFeed) {
        throw new NotFoundException('信息流不存在');
      }

      // 构建更新字段
      const updates: any = {};
      Object.entries(updateDto).forEach(([key, value]) => {
        if (value !== undefined) updates[key] = value;
      });

      if (Object.keys(updates).length === 0) {
        throw new BadRequestException('没有需要更新的字段');
      }

      const result = await this.feedsRepo.update(id, updates);
      this.logger.log(`更新信息流成功 - id: ${id}, userId: ${currentUserId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `更新信息流失败 - id: ${id}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 删除信息流
   */
  async deleteInfoFeed(id: number, currentUserId: string): Promise<boolean> {
    try {
      await this.feedsRepo.delete(id);
      this.logger.log(`删除信息流成功 - id: ${id}, userId: ${currentUserId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `删除信息流失败 - id: ${id}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 信息流点赞/取消点赞
   */
  async toggleInfoFeedLike(
    feedId: number,
    userId: string,
  ): Promise<InfoFeedLikeResponse> {
    try {
      const isCurrentlyLiked = await this.likesRepo.existsFeedLike(feedId, userId);
      if (isCurrentlyLiked) {
        await this.likesRepo.removeFeedLike(feedId, userId);
      } else {
        await this.likesRepo.addFeedLike(feedId, userId);
      }
      const likeCount = await this.likesRepo.getFeedLikeCount(feedId);
      this.logger.log(
        `信息流点赞状态切换成功 - feedId: ${feedId}, userId: ${userId}, isLiked: ${!isCurrentlyLiked}`,
      );

      return {
        success: true,
        is_liked: !isCurrentlyLiked,
        like_count: likeCount,
      };
    } catch (error) {
      this.logger.error(
        `信息流点赞操作失败 - feedId: ${feedId}, userId: ${userId}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 获取信息流评论列表
   */
  async getCommentList(
    query: CommentListQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResponse<InfoFeedCommentResponse>> {
    const feedId = Number((query as any).feed_id ?? query.feed_id);
    const pageNumRaw = (query as any).page ?? query.page ?? 1;
    const limitNumRaw = (query as any).limit ?? query.limit ?? 20;
    const page = Number(pageNumRaw);
    const limit = Number(limitNumRaw);
    const safePage = Number.isFinite(page) && page >= 1 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20;

    try {
      const [comments, total] = await Promise.all([
        this.commentsRepo.listTopLevelByFeed(feedId, safePage, safeLimit),
        this.commentsRepo.countTopLevelByFeed(feedId),
      ]);

      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          // 检查点赞状态
          let isLiked = false;
          if (currentUserId) {
            isLiked = await this.likesRepo.existsCommentLike(comment.id, currentUserId);
          }

          // 获取回复（限制数量，避免性能问题）
          const replies = await this.commentsRepo.listReplies(comment.id, 5);

          return {
            ...comment,
            is_liked: isLiked,
            replies: replies || [],
          };
        }),
      );
      const totalPages = Math.ceil(total / safeLimit);

      this.logger.log(
        `获取评论列表成功 - feedId: ${feedId}, page: ${safePage}, limit: ${safeLimit}, total: ${total}`,
      );

      return {
        data: enrichedComments,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          total_pages: totalPages,
          has_next: safePage < totalPages,
          has_prev: safePage > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `获取评论列表失败 - feedId: ${feedId}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 创建评论
   */
  async createComment(
    createDto: CreateCommentDto,
    userId: string,
  ): Promise<InfoFeedComment> {
    try {
      const parentIdRaw: any = (createDto as any).parent_id;
      const parentId =
        parentIdRaw === undefined || parentIdRaw === null || parentIdRaw === ''
          ? null
          : Number(parentIdRaw);
      const safeParentId = Number.isFinite(parentId) ? parentId : null;

      const result = await this.commentsRepo.create(
        Number(createDto.feed_id),
        userId,
        createDto.content,
        safeParentId,
      );
      this.logger.log(`创建评论成功 - id: ${result.id}, feedId: ${createDto.feed_id}, userId: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        '创建评论失败',
        error.stack || error.message || String(error),
      );
      throw error;
    }
  }

  /**
   * 评论点赞/取消点赞
   */
  async toggleCommentLike(
    commentId: number,
    userId: string,
  ): Promise<InfoFeedLikeResponse> {
    try {
      const isCurrentlyLiked = await this.likesRepo.existsCommentLike(commentId, userId);
      if (isCurrentlyLiked) {
        await this.likesRepo.removeCommentLike(commentId, userId);
      } else {
        await this.likesRepo.addCommentLike(commentId, userId);
      }
      const likeCount = await this.likesRepo.getCommentLikeCount(commentId);
      this.logger.log(
        `评论点赞状态切换成功 - commentId: ${commentId}, userId: ${userId}, isLiked: ${!isCurrentlyLiked}`,
      );

      return {
        success: true,
        is_liked: !isCurrentlyLiked,
        like_count: likeCount,
      };
    } catch (error) {
      this.logger.error(
        `评论点赞操作失败 - commentId: ${commentId}, userId: ${userId}, error: ${error.message}`,
        error.stack || String(error),
      );
      throw error;
    }
  }

  /**
   * 私有方法：增加浏览次数
   */
  private async incrementViewCount(feedId: number): Promise<void> {
    try {
      await this.feedsRepo.incrementViewCount(feedId);
    } catch (error) {
      // 浏览次数更新失败不影响主要功能
      this.logger.warn(
        `更新浏览次数失败 - feedId: ${feedId}, error: ${error.message}`,
      );
    }
  }

  /**
   * 私有方法：根据ID获取信息流基础信息
   */
  private async getInfoFeedById(id: number): Promise<InfoFeed | null> {
    try {
      const result = await this.feedsRepo.getById(id);
      return result || null;
    } catch (error) {
      this.logger.error(
        `根据ID查询信息流失败 - id: ${id}, error: ${error.message}`,
        error.stack || String(error),
      );
      return null;
    }
  }

  /**
   * 私有方法：从内容中提取缩略图
   */
  private extractThumbnailFromContent(
    content: string,
  ): ThumbnailExtractionResult {
    // 简单的图片URL提取逻辑
    const imageUrlRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imageUrlRegex);

    if (match && match[1]) {
      return {
        url: match[1],
        from_content: true,
      };
    }

    return {
      from_content: false,
    };
  }

  /**
   * 回复评论：根据父评论获取feed_id后创建子评论
   */
  async replyToComment(commentId: number, content: string, userId: string): Promise<InfoFeedComment> {
    const parent = await this.commentsRepo.getById(commentId);
    if (!parent) {
      throw new NotFoundException('父评论不存在');
    }
    const created = await this.commentsRepo.create(parent.feed_id, userId, content, commentId);
    this.logger.log(`回复评论成功 - parentId: ${commentId}, id: ${created.id}`);
    return created;
  }
}
