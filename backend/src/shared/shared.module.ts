import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { DifyService } from './services/dify.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [DifyService],
  exports: [DatabaseModule, DifyService],
})
export class SharedModule {}