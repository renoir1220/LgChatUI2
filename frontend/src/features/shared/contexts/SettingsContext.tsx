import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 用户设置接口
export interface UserSettings {
  // 外观设置
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  
  // 聊天设置
  autoScroll: boolean;
  sendOnEnter: boolean; // true: Enter发送, false: Ctrl+Enter发送
  showTimestamp: boolean;
  enableNotifications: boolean;
  
  // 知识库设置
  defaultKnowledgeBase?: string;
  showCitations: boolean;
  
  // 高级设置
  streamingEnabled: boolean;
  maxTokens: number;
  temperature: number;
  
  // 界面设置
  sidebarDefaultOpen: boolean;
  messagePreviewLines: number;
}

// 默认设置
const defaultSettings: UserSettings = {
  theme: 'auto',
  fontSize: 'medium',
  autoScroll: true,
  sendOnEnter: true,
  showTimestamp: true,
  enableNotifications: true,
  showCitations: true,
  streamingEnabled: true,
  maxTokens: 2048,
  temperature: 0.7,
  sidebarDefaultOpen: true,
  messagePreviewLines: 3,
};

// 设置上下文接口
interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// 创建上下文
const SettingsContext = createContext<SettingsContextType | null>(null);

// 存储键
const SETTINGS_STORAGE_KEY = 'lgchat_user_settings';

// 设置Provider组件
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  
  // 加载设置
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // 合并默认设置和存储的设置，确保所有字段都存在
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('加载用户设置失败:', error);
      setSettings(defaultSettings);
    }
  }, []);
  
  // 保存设置
  const saveSettings = useCallback((newSettings: UserSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('保存用户设置失败:', error);
    }
  }, []);
  
  // 更新单个设置
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);
  
  // 更新多个设置
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);
  
  // 重置设置
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);
  
  // 导出设置
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);
  
  // 导入设置
  const importSettings = useCallback((settingsJson: string): boolean => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      // 验证设置格式
      if (typeof importedSettings === 'object' && importedSettings !== null) {
        const validatedSettings = { ...defaultSettings, ...importedSettings };
        setSettings(validatedSettings);
        saveSettings(validatedSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入设置失败:', error);
      return false;
    }
  }, [saveSettings]);
  
  // 初始化时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // 应用主题设置
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else { // auto
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    applyTheme();
    
    // 监听系统主题变化
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      
      return () => {
        mediaQuery.removeEventListener('change', applyTheme);
      };
    }
  }, [settings.theme]);
  
  // 应用字体大小设置
  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    
    root.style.fontSize = fontSizeMap[settings.fontSize];
  }, [settings.fontSize]);
  
  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };
  
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook来使用设置系统
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// 便捷Hook：获取特定设置值
export function useSetting<K extends keyof UserSettings>(key: K): [UserSettings[K], (value: UserSettings[K]) => void] {
  const { settings, updateSetting } = useSettings();
  
  const setValue = useCallback((value: UserSettings[K]) => {
    updateSetting(key, value);
  }, [key, updateSetting]);
  
  return [settings[key], setValue];
}