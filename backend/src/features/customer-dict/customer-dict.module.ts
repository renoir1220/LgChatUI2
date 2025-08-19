import { Module } from '@nestjs/common';
import { CustomerDictController } from './customer-dict.controller';
import { CustomerDictService } from './customer-dict.service';
import { CustomerDictRepository } from './customer-dict.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CustomerDictController],
  providers: [CustomerDictService, CustomerDictRepository],
  exports: [CustomerDictService, CustomerDictRepository],
})
export class CustomerDictModule {}