import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { DifyService } from '../../shared/services/dify.service';

@Module({
  controllers: [FilesController],
  providers: [DifyService],
})
export class FilesModule {}