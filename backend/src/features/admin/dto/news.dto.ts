import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { InfoFeedCategory, InfoFeedStatus } from '../../../types/infofeed';

export class ListNewsQueryDto {
  @IsOptional()
  @IsString()
  category?: string; // 支持逗号分隔多选，如: news,features

  @IsOptional()
  @IsString()
  status?: string; // 支持逗号分隔多选，如: draft,published

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class CreateNewsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsEnum(InfoFeedCategory)
  category?: InfoFeedCategory;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsString()
  source?: 'manual' | 'auto';

  @IsOptional()
  @IsString()
  author_id?: string;

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

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsEnum(InfoFeedCategory)
  category?: InfoFeedCategory;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsString()
  source?: 'manual' | 'auto';

  @IsOptional()
  @IsString()
  author_id?: string;

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

export class UpdateStatusDto {
  @IsEnum(InfoFeedStatus)
  status!: InfoFeedStatus;
}
