import { Module } from '@nestjs/common';
import { FeatureSearchController } from './feature-search.controller';
import { FeatureSearchService } from './feature-search.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [FeatureSearchController],
  providers: [FeatureSearchService],
  exports: [FeatureSearchService],
})
export class FeatureSearchModule {}
