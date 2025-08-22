import { Module } from '@nestjs/common';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';
import { BugsRepository } from './bugs.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [BugsController],
  providers: [BugsService, BugsRepository],
  exports: [BugsService],
})
export class BugsModule {}