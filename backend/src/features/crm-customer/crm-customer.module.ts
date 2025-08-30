import { Module } from '@nestjs/common';
import { CrmCustomerController } from './crm-customer.controller';
import { CrmCustomerRepository } from './repositories/crm-customer.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule], // 导入共享模块以获取数据库服务
  controllers: [CrmCustomerController],
  providers: [CrmCustomerRepository],
  exports: [CrmCustomerRepository], // 导出Repository供其他模块使用
})
export class CrmCustomerModule {}