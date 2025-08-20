import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS配置
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  // 配置静态文件服务
  const staticPath = join(__dirname, '../../static');
  app.useStaticAssets(staticPath, {
    prefix: '/static/',
    setHeaders: (res, path) => {
      // 缓存策略：静态资源长期缓存，HTML文件不缓存
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (
        path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  // 监听所有网络接口，允许Docker容器访问
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(`应用已启动，监听端口: ${process.env.PORT ?? 3000}`);
  console.log(`静态文件服务路径: ${staticPath}`);
}
bootstrap();
