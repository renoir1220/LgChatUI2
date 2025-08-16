import { Injectable, Logger } from '@nestjs/common';
import WebSocket from 'ws';
import * as uuid from 'uuid';
import {
  MsgType,
  ReceiveMessage,
  FullClientRequest,
  EventType,
  WaitForEvent,
} from './protocols';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  /**
   * 根据音色类型确定集群
   */
  private voiceToCluster(voice: string): string {
    if (voice.startsWith('S_')) {
      return 'volcano_icl';
    }
    return 'volcano_tts';
  }

  /**
   * 文本转语音合成
   */
  async synthesizeText(
    text: string,
    voiceType: string = 'zh_female_qingxin',
    encoding: string = 'wav',
    appid: string,
    accessToken: string,
    endpoint: string = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary',
  ): Promise<Buffer> {
    const headers = {
      Authorization: `Bearer;${accessToken}`,
    };

    const ws = new WebSocket(endpoint, {
      headers,
      skipUTF8Validation: true,
    });

    try {
      // 等待连接建立
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      this.logger.log('WebSocket连接已建立');

      // 构建TTS请求
      const request = {
        app: {
          appid,
          token: accessToken,
          cluster: this.voiceToCluster(voiceType),
        },
        user: {
          uid: uuid.v4(),
        },
        audio: {
          voice_type: voiceType,
          encoding,
        },
        request: {
          reqid: uuid.v4(),
          text,
          operation: 'submit',
          extra_param: JSON.stringify({
            disable_markdown_filter: false,
          }),
          with_timestamp: '1',
        },
      };

      // 发送TTS请求
      await FullClientRequest(
        ws,
        new TextEncoder().encode(JSON.stringify(request)),
      );

      this.logger.log('TTS请求已发送');

      // 接收音频数据
      const totalAudio: Uint8Array[] = [];

      while (true) {
        const msg = await ReceiveMessage(ws);
        this.logger.debug(`收到消息: ${msg.toString()}`);

        switch (msg.type) {
          case MsgType.FrontEndResultServer:
            // 前端结果消息，继续等待
            break;
          case MsgType.AudioOnlyServer:
            // 音频数据
            totalAudio.push(msg.payload);
            break;
          default:
            throw new Error(`未知消息类型: ${msg.toString()}`);
        }

        // 检查是否结束（序列号为负数表示最后一个包）
        if (
          msg.type === MsgType.AudioOnlyServer &&
          msg.sequence !== undefined &&
          msg.sequence < 0
        ) {
          this.logger.log('音频接收完成');
          break;
        }
      }

      if (totalAudio.length === 0) {
        throw new Error('未接收到音频数据');
      }

      // 合并音频数据
      const totalLength = totalAudio.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of totalAudio) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      this.logger.log(`音频合成完成，大小: ${result.length} 字节`);
      return Buffer.from(result);

    } catch (error) {
      this.logger.error('TTS合成失败', error);
      throw error;
    } finally {
      ws.close();
    }
  }
}