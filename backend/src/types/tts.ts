// TTS语音合成相关类型定义
import { z } from 'zod';

// TTS请求数据验证模式
export const TtsRequestSchema = z.object({
  text: z.string().min(1, '文本不能为空').max(5000, '文本长度不能超过5000字符'),
  voiceType: z.string().optional(),
  encoding: z.string().optional().default('wav'),
});

// TTS响应类型
export interface TtsResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  duration?: number;
}

// 支持的音色类型
export enum VoiceType {
  // 中文音色
  CHINESE_FEMALE_1 = 'zh_female_qinqing',
  CHINESE_MALE_1 = 'zh_male_yujin',
  // 英文音色
  ENGLISH_FEMALE_1 = 'en_female_sara',
  ENGLISH_MALE_1 = 'en_male_adam',
}

// 支持的音频编码
export enum AudioEncoding {
  WAV = 'wav',
  MP3 = 'mp3',
  PCM = 'pcm',
}

// 从 Zod 模式推导类型
export type TtsRequest = z.infer<typeof TtsRequestSchema>;
