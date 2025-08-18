import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  // 监听所有网络接口，允许Docker容器访问
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
