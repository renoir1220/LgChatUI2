import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// 加载环境变量
dotenv.config();

async function bootstrap() {
  // HTTPS配置
  let httpsOptions: any = undefined;
  if (process.env.ENABLE_HTTPS === 'true') {
    const certPath = join(__dirname, '../cert.pem');
    const keyPath = join(__dirname, '../key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('HTTPS证书加载成功');
    } else {
      console.warn('HTTPS证书文件不存在，使用HTTP模式');
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, 
    httpsOptions ? { httpsOptions } : {}
  );

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
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`应用已启动，监听端口: ${port}`);
  console.log(`访问地址: ${protocol}://172.20.10.3:${port}`);
  console.log(`静态文件服务路径: ${staticPath}`);
}
bootstrap();
