// 运行时配置服务
// 负责加载和管理应用的动态配置

import { useState, useEffect } from 'react';

export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  apiKey: string;
  apiUrl: string;
}

export interface AppConfig {
  API_BASE: string;
  DEFAULT_DIFY_API_URL: string;
  IMAGE_BASE_URL: string;
  KNOWLEDGE_BASES: KnowledgeBaseConfig[];
  DEBUG_MODE: boolean;
  VERSION: string;
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig;
  }
}

class ConfigService {
  private config: AppConfig | null = null;
  private loadPromise: Promise<AppConfig> | null = null;

  /**
   * 获取配置，如果未加载则先加载
   */
  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadConfig();
    return this.loadPromise;
  }

  /**
   * 加载运行时配置
   */
  private async loadConfig(): Promise<AppConfig> {
    try {
      // 如果配置已经在window对象中，直接使用
      if (window.APP_CONFIG) {
        this.config = window.APP_CONFIG;
        return this.config;
      }

      // 动态加载配置文件
      await this.loadConfigScript();

      if (window.APP_CONFIG) {
        this.config = window.APP_CONFIG;
        return this.config;
      }

      throw new Error('配置文件加载失败');
    } catch (error) {
      console.error('加载运行时配置失败，使用默认配置:', error);
      
      // 使用默认配置（从环境变量获取）
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * 动态加载配置脚本
   */
  private loadConfigScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载过
      const existingScript = document.querySelector('script[src="/config.js"]');
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/config.js?t=' + Date.now(); // 避免缓存
      script.type = 'text/javascript';
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('配置文件加载失败'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * 获取默认配置（后备方案）
   */
  private getDefaultConfig(): AppConfig {
    return {
      API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:3000',
      DEFAULT_DIFY_API_URL: import.meta.env.VITE_DEFAULT_DIFY_API_URL || 'http://localhost/v1/chat-messages',
      IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_BASE_URL || '',
      KNOWLEDGE_BASES: [
        {
          id: 'kb_1',
          name: import.meta.env.VITE_KB_1_NAME || '仅聊天',
          apiKey: import.meta.env.VITE_KB_1_API_KEY || '',
          apiUrl: import.meta.env.VITE_KB_1_URL || 'http://localhost/v1'
        },
        {
          id: 'kb_2',
          name: import.meta.env.VITE_KB_2_NAME || '集成知识库',
          apiKey: import.meta.env.VITE_KB_2_API_KEY || '',
          apiUrl: import.meta.env.VITE_KB_2_URL || 'http://localhost/v1'
        },
        {
          id: 'kb_3',
          name: import.meta.env.VITE_KB_3_NAME || '技术文档库',
          apiKey: import.meta.env.VITE_KB_3_API_KEY || '',
          apiUrl: import.meta.env.VITE_KB_3_URL || 'https://custom.dify.ai/v1'
        }
      ],
      DEBUG_MODE: import.meta.env.DEV || false,
      VERSION: '1.0.0'
    };
  }

  /**
   * 重新加载配置（用于热更新）
   */
  async reloadConfig(): Promise<AppConfig> {
    this.config = null;
    this.loadPromise = null;
    return this.getConfig();
  }

  /**
   * 获取API基础URL
   */
  async getApiBase(): Promise<string> {
    const config = await this.getConfig();
    return config.API_BASE;
  }

  /**
   * 获取知识库配置列表
   */
  async getKnowledgeBases(): Promise<KnowledgeBaseConfig[]> {
    const config = await this.getConfig();
    return config.KNOWLEDGE_BASES;
  }

  /**
   * 根据ID获取知识库配置
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBaseConfig | undefined> {
    const config = await this.getConfig();
    return config.KNOWLEDGE_BASES.find(kb => kb.id === id);
  }
}

// 导出单例
export const configService = new ConfigService();

// 便捷的Hook
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configService.getConfig()
      .then(config => {
        setConfig(config);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        console.error('配置加载失败:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const reloadConfig = async () => {
    setLoading(true);
    try {
      const newConfig = await configService.reloadConfig();
      setConfig(newConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '配置重载失败');
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, error, reloadConfig };
}