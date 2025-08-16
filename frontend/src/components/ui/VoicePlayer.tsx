import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoicePlayerProps {
  text: string;
  className?: string;
  voiceType?: string;
  encoding?: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  text,
  className = '',
  voiceType = 'zh_female_qingxin',
  encoding = 'wav',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async () => {
    if (isPlaying) {
      // 暂停播放
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 如果已有音频对象且未结束，继续播放
      if (audioRef.current && !audioRef.current.ended) {
        audioRef.current.play();
        setIsPlaying(true);
        return;
      }

      // 请求TTS服务
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceType,
          encoding,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '语音合成失败' }));
        throw new Error(errorData.message || '语音合成失败');
      }

      // 获取音频数据
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 创建新的音频对象
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      
      // 设置音频事件监听器
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      };
      audioRef.current.onerror = () => {
        setError('音频播放失败');
        setIsPlaying(false);
        if (audioRef.current) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      };

      // 开始播放
      await audioRef.current.play();

    } catch (err) {
      console.error('语音播放失败:', err);
      setError(err instanceof Error ? err.message : '语音播放失败');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件卸载时清理资源
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title={error || (isPlaying ? '暂停播放' : '语音播放')}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      {error && (
        <span className="ml-2 text-xs text-red-500" title={error}>
          播放失败
        </span>
      )}
    </div>
  );
};