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
} from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateSuggestionRequestSchema,
  UpdateSuggestionRequestSchema,
  SuggestionQuerySchema,
  type CreateSuggestionRequest,
  type UpdateSuggestionRequest,
  type SuggestionQuery,
  type Suggestion,
  type SuggestionListResponse,
} from '../../types';

@Controller('api/suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  /**
   * 创建建议
   */
  @Post()
  async createSuggestion(
    @Body(new ZodValidationPipe(CreateSuggestionRequestSchema))
    data: CreateSuggestionRequest,
    @Request() req: any,
  ): Promise<Suggestion> {
    const submitterName = req.user?.username || '未知用户';
    return this.suggestionsService.createSuggestion(submitterName, data);
  }

  /**
   * 查询建议列表
   */
  @Get()
  async getSuggestions(
    @Query(new ZodValidationPipe(SuggestionQuerySchema))
    query: SuggestionQuery,
  ): Promise<SuggestionListResponse> {
    return this.suggestionsService.getSuggestions(query);
  }

  /**
   * 获取建议详情
   */
  @Get(':id')
  async getSuggestion(@Param('id') suggestionId: string): Promise<Suggestion> {
    return this.suggestionsService.getSuggestionById(suggestionId);
  }

  /**
   * 更新建议（管理员用）
   */
  @Put(':id')
  async updateSuggestion(
    @Param('id') suggestionId: string,
    @Body(new ZodValidationPipe(UpdateSuggestionRequestSchema))
    data: UpdateSuggestionRequest,
  ): Promise<void> {
    await this.suggestionsService.updateSuggestion(suggestionId, data);
  }

  /**
   * 删除建议
   */
  @Delete(':id')
  async deleteSuggestion(@Param('id') suggestionId: string): Promise<void> {
    await this.suggestionsService.deleteSuggestion(suggestionId);
  }
}
