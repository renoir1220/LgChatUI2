import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'kbKey 仅支持字母、数字、下划线和中划线' })
  kbKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  apiKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  apiUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  availableUsers?: string;

  @IsBoolean()
  canSelectModel!: boolean;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'kbKey 仅支持字母、数字、下划线和中划线' })
  kbKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  apiUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  availableUsers?: string;

  @IsOptional()
  @IsBoolean()
  canSelectModel?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
