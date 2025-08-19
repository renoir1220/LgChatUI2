import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { RequirementsRepository } from './requirements.repository';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, RequirementsRepository],
  exports: [RequirementsService],
})
export class RequirementsModule {}