import { Module } from '@nestjs/common';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsRepository } from './suggestions.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, SuggestionsRepository],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
