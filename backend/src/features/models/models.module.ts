import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsRepository } from './models.repository';

@Module({
  controllers: [ModelsController],
  providers: [ModelsRepository],
  exports: [ModelsRepository],
})
export class ModelsModule {}

