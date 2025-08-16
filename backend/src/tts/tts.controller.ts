import {
  Controller,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as express from 'express';
import { TtsService } from './tts.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { z } from 'zod';

// TTS请求数据验证模式
const TtsRequestSchema = z.object({
  text: z.string().min(1, '文本不能为空').max(5000, '文本长度不能超过5000字符'),
  voiceType: z.string().optional().default('zh_female_qingxin'),
  encoding: z.string().optional().default('wav'),
});

type TtsRequest = z.infer<typeof TtsRequestSchema>;

@Controller('api/tts')
export class TtsController {
  private readonly logger = new Logger(TtsController.name);

  constructor(private readonly ttsService: TtsService) {}

  @Post('synthesize')
  async synthesize(
    @Body(new ZodValidationPipe(TtsRequestSchema)) body: TtsRequest,
    @Res() res: express.Response,
  ) {
    try {
      // 从环境变量获取配置
      const appid = process.env.VOLCENGINE_APPID;
      const accessToken = process.env.VOLCENGINE_ACCESS_TOKEN;

      if (!appid || !accessToken) {
        throw new HttpException(
          '火山引擎TTS配置缺失，请检查环境变量 VOLCENGINE_APPID 和 VOLCENGINE_ACCESS_TOKEN',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`开始合成语音: ${body.text.substring(0, 50)}...`);

      // 调用TTS服务合成语音
      const audioBuffer = await this.ttsService.synthesizeText(
        body.text,
        body.voiceType,
        body.encoding,
        appid,
        accessToken,
      );

      // 设置响应头
      res.setHeader('Content-Type', `audio/${body.encoding}`);
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时

      // 返回音频流
      res.send(audioBuffer);

      this.logger.log(`语音合成完成，大小: ${audioBuffer.length} 字节`);

    } catch (error) {
      this.logger.error('TTS合成失败', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '语音合成失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}