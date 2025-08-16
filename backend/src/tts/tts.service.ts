import { Injectable, Logger } from '@nestjs/common';
import WebSocket from 'ws';
import * as uuid from 'uuid';
import * as crypto from 'crypto';
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
   * 生成模拟音频数据（用于测试环境）
   */
  private generateMockAudio(text: string): Buffer {
    this.logger.log(`生成模拟音频: ${text.substring(0, 50)}...`);
    
    // 生成一个简单的WAV文件头
    const sampleRate = 44100;
    const duration = Math.min(text.length * 0.1, 10); // 根据文本长度计算时长，最长10秒
    const numSamples = Math.floor(sampleRate * duration);
    
    // WAV文件头 (44字节)
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * 2, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);  // PCM格式
    header.writeUInt16LE(1, 22);  // 单声道
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(numSamples * 2, 40);
    
    // 生成简单的正弦波音频数据
    const audioData = Buffer.alloc(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3; // 440Hz的音调
      audioData.writeInt16LE(Math.floor(sample * 32767), i * 2);
    }
    
    return Buffer.concat([header, audioData]);
  }

  /**
   * 生成火山引擎API签名
   */
  private generateSignature(
    accessToken: string,
    secretKey: string,
    timestamp: string,
  ): string {
    const stringToSign = `${accessToken}\n${timestamp}`;
    return crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign, 'utf8')
      .digest('hex');
  }

  /**
   * 使用API Key进行TTS合成（使用传统格式但API Key认证）
   */
  private async synthesizeWithApiKey(
    text: string,
    voiceType: string,
    encoding: string,
    apiKey: string,
    endpoint: string,
  ): Promise<Buffer> {
    try {
      // 从环境变量获取appid
      const appid = process.env.VOLCENGINE_APPID;
      
      const requestBody = {
        app: {
          appid,
          token: apiKey, // 使用API Key作为token
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
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API Key TTS请求失败: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`API Key TTS请求失败: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      this.logger.log(`API Key TTS合成完成，大小: ${audioBuffer.byteLength} 字节`);
      return Buffer.from(audioBuffer);

    } catch (error) {
      this.logger.error('API Key TTS合成失败', error);
      throw error;
    }
  }

  /**
   * 根据音色类型确定集群
   */
  private voiceToCluster(voice: string): string {
    const v = (voice || '').trim();
    const lower = v.toLowerCase();
    
    // ICL 系列音色通常以 "ICL_" 或 "S_" 开头，归属 volcano_icl 集群
    if (v.startsWith('S_') || v.startsWith('ICL_') || lower.startsWith('icl_')) {
      return 'volcano_icl';
    }
    
    // 明确的volcano_tts集群音色
    if (lower.includes('bigtts') || 
        lower.includes('daimengchuanmei') || 
        lower.includes('qingxin') ||
        lower.includes('qinghuan') ||
        lower.includes('qinglan')) {
      return 'volcano_tts';
    }
    
    // 默认集群
    return 'volcano_tts';
  }

  /**
   * 文本转语音合成 - WebSocket版本（与volcengine_binary_demo一致）
   */
  async synthesizeText(
    text: string,
    voiceType: string = 'zh_female_daimengchuanmei_moon_bigtts',
    encoding: string = 'wav',
    appid: string,
    accessToken: string,
    secretKey?: string,
    apiKey?: string,
    endpoint: string = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary',
  ): Promise<Buffer> {
    // 检查是否为测试环境配置
    if (appid === 'test_appid' || accessToken === 'test_access_token') {
      return this.generateMockAudio(text);
    }
    
    this.logger.log(`使用配置 - APPID: ${appid}, ACCESS_TOKEN: ...${accessToken?.slice(-4) || 'N/A'}, 音色: ${voiceType}`);
    
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

      this.logger.log(`WebSocket连接已建立 - 端点: ${endpoint}`);

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

      this.logger.log(`TTS请求已发送 - reqid: ${request.request.reqid}, cluster: ${request.app.cluster}`);

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
          case MsgType.Error:
            // 处理服务端错误
            const errorPayload = new TextDecoder().decode(msg.payload);
            let errorInfo;
            try {
              errorInfo = JSON.parse(errorPayload);
            } catch {
              errorInfo = { message: errorPayload };
            }
            
            this.logger.error(
              `TTS服务返回错误 [code=${msg.errorCode ?? errorInfo?.code ?? 'N/A'}]: ${errorInfo.message || errorPayload}`,
            );
            
            // 根据错误码提供更友好的错误信息
            if (
              msg.errorCode === 3001 ||
              errorInfo.code === 401 ||
              errorInfo.code === 403
            ) {
              throw new Error(
                '火山引擎TTS认证失败：请检查 APPID 与 ACCESS_TOKEN 是否匹配，或 voice_type 与集群是否匹配（ICL 前缀音色需要 volcano_icl）',
              );
            } else if (msg.errorCode === 3002) {
              throw new Error('TTS请求参数错误');
            } else if (msg.errorCode === 3003) {
              throw new Error('TTS服务器内部错误');
            } else {
              throw new Error(`TTS服务错误: ${errorInfo.message || '未知错误'}`);
            }
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
