/**
 * 信息流功能数据传输对象(DTO)定义
 *
 * 用于API接口的请求和响应数据验证
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsUrl,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  InfoFeedCategory,
  InfoFeedSource,
  InfoFeedStatus,
} from '../../../types/infofeed';

/**
 * 信息流列表查询参数DTO
 */
export class InfoFeedListQueryDto {
  @IsOptional()
  @IsEnum(InfoFeedCategory)
  category?: InfoFeedCategory;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['publish_time', 'view_count', 'like_count'])
  order_by?: 'publish_time' | 'view_count' | 'like_count' = 'publish_time';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order_direction?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * 创建信息流请求DTO
 */
export class CreateInfoFeedDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsEnum(InfoFeedCategory)
  category: InfoFeedCategory;

  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  @IsOptional()
  @IsEnum(InfoFeedSource)
  source?: InfoFeedSource = InfoFeedSource.MANUAL;

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean = false;

  @IsOptional()
  @IsEnum(InfoFeedStatus)
  status?: InfoFeedStatus = InfoFeedStatus.PUBLISHED;

  @IsOptional()
  @IsDateString()
  publish_time?: string;
}

/**
 * 更新信息流请求DTO
 */
export class UpdateInfoFeedDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsEnum(InfoFeedCategory)
  category?: InfoFeedCategory;

  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  @IsOptional()
  @IsEnum(InfoFeedSource)
  source?: InfoFeedSource;

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsOptional()
  @IsEnum(InfoFeedStatus)
  status?: InfoFeedStatus;

  @IsOptional()
  @IsDateString()
  publish_time?: string;
}

/**
 * 创建评论请求DTO
 */
export class CreateCommentDto {
  @IsInt()
  @Min(1)
  feed_id: number;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  parent_id?: number;
}

/**
 * 信息流详情参数DTO
 */
export class InfoFeedDetailParamsDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  id: number;
}

/**
 * 评论列表查询参数DTO
 */
export class CommentListQueryDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  feed_id: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

/**
 * 点赞操作参数DTO
 */
export class LikeActionParamsDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  id: number;
}

/**
 * 评论点赞操作参数DTO
 */
export class CommentLikeActionParamsDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  comment_id: number;
}

/**
 * 回复评论请求DTO
 */
export class ReplyCommentDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  comment_id: number;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
