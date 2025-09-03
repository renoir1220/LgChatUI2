/**
 * 操作命令处理器
 * 处理AI消息中按钮的各种命令，如页面跳转、数据导出等
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { message } from 'antd';
import { navigateTo } from './navigation';
import { apiGet } from './api';
import { ReadmeDetailModal } from '../components/ReadmeDetailModal';
import type { ReadmeApiResponse } from '@types';

/** 命令处理函数签名 */
export type CommandHandler = (params: Record<string, string>) => void | Promise<void>;

/** 可用的命令处理器映射 */
const commandHandlers: Record<string, CommandHandler> = {
  /**
   * 跳转到客户站点汇总页面
   * 参数: customerName - 客户名称
   */
  navigate_customer_sites: (params) => {
    const { customerName } = params;
    if (!customerName) {
      message.error('缺少客户名称参数');
      return;
    }
    
    // 构建跳转URL - 跳转到客户信息页面的站点汇总子页面
    const encodedCustomerName = encodeURIComponent(customerName);
    const targetUrl = `/customer?customerName=${encodedCustomerName}&defaultTab=sites&defaultSubTab=summary`;
    
    // 单页应用导航（保持路由历史，支持 Esc/后退返回）
    navigateTo(targetUrl);
    // 不提示成功 toast，避免干扰跳转
  },

  /**
   * 跳转到客户详情页面
   * 参数: customerName - 客户名称
   */
  navigate_customer_detail: (params) => {
    const { customerName } = params;
    if (!customerName) {
      message.error('缺少客户名称参数');
      return;
    }
    
    // 跳转到客户信息页面的动态主页面
    const encodedCustomerName = encodeURIComponent(customerName);
    const targetUrl = `/customer?customerName=${encodedCustomerName}&defaultTab=dynamic`;
    
    navigateTo(targetUrl);
  },

  /**
   * 导出客户站点数据
   * 参数: customerName - 客户名称, format - 导出格式(excel, pdf等)
   */
  export_customer_sites: async (params) => {
    const { customerName, format = 'excel' } = params;
    if (!customerName) {
      message.error('缺少客户名称参数');
      return;
    }
    
    message.loading(`正在导出${customerName}的站点数据...`);
    
    try {
      // TODO: 这里需要调用实际的导出API
      // const response = await apiPost('/api/admin/export/customer-sites', {
      //   customerName,
      //   format
      // });
      
      // 模拟导出过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success(`${customerName}的站点数据导出成功`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  },

  /**
   * 跳转到添加站点页面
   * 参数: customerName - 客户名称, type - 站点类型
   */
  navigate_add_site: (params) => {
    const { customerName, type } = params;
    if (!customerName) {
      message.error('缺少客户名称参数');
      return;
    }
    
    let targetUrl = `/admin/sites/add?customer=${encodeURIComponent(customerName)}`;
    if (type) {
      targetUrl += `&type=${encodeURIComponent(type)}`;
    }
    
    window.open(targetUrl, '_blank');
    message.success('正在跳转到添加站点页面');
  },

  /**
   * 通用页面跳转
   * 参数: url - 目标URL, newTab - 是否在新标签页打开(默认true)
   */
  navigate: (params) => {
    const { url, newTab = 'true' } = params;
    if (!url) {
      message.error('缺少目标URL参数');
      return;
    }
    
    if (newTab === 'true') {
      window.open(url, '_blank');
    } else {
      // 对站内相对路径使用 SPA 导航
      if (url.startsWith('/')) {
        navigateTo(url);
      } else {
        window.location.href = url;
      }
    }
  },

  /**
   * 显示提示信息
   * 参数: text - 提示文本, type - 提示类型(success, info, warning, error)
   */
  show_message: (params) => {
    const { text, type = 'info' } = params;
    if (!text) {
      return;
    }
    
    switch (type) {
      case 'success':
        message.success(text);
        break;
      case 'warning':
        message.warning(text);
        break;
      case 'error':
        message.error(text);
        break;
      default:
        message.info(text);
        break;
    }
  },

  /**
   * 复制文本到剪贴板
   * 参数: text - 要复制的文本
   */
  copy_text: async (params) => {
    const { text } = params;
    if (!text) {
      message.error('缺少要复制的文本');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      message.success('文本已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  },

  /**
   * 显示README配置信息
   * 参数: readmeId - README记录的ID
   */
  showReadme: async (params) => {
    const { readmeId } = params;
    if (!readmeId) {
      message.error('缺少README ID参数');
      return;
    }

    // 显示加载提示
    const loadingMessage = message.loading('正在加载README内容...', 0);

    try {
      // 调用后端API获取README详情
      const response = await apiGet<ReadmeApiResponse>(`/api/readme-search/${readmeId}`);
      
      // 关闭加载提示
      loadingMessage();

      if (!response.success || !response.data) {
        message.error('获取README内容失败');
        return;
      }

      const readme = response.data;
      
      // 获取鼠标点击位置
      const clickPosition = (window as any).lastClickPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      // 创建模态框容器
      const modalContainer = document.createElement('div');
      modalContainer.id = 'readme-modal-container';
      document.body.appendChild(modalContainer);

      // 创建React根并渲染组件
      const root = createRoot(modalContainer);
      
      const handleClose = () => {
        root.unmount();
        document.body.removeChild(modalContainer);
      };

      root.render(
        React.createElement(ReadmeDetailModal, {
          readme: readme,
          visible: true,
          onClose: handleClose,
          position: clickPosition
        })
      );

    } catch (error) {
      // 关闭加载提示
      loadingMessage();
      
      console.error('获取README失败:', error);
      message.error('获取README内容失败，请重试');
    }
  }
};

/**
 * 执行指定的命令
 * @param command - 命令名称
 * @param params - 命令参数
 */
export async function executeCommand(command: string, params: Record<string, string>): Promise<void> {
  const handler = commandHandlers[command];
  
  if (!handler) {
    console.warn(`未知命令: ${command}`);
    message.error(`不支持的操作: ${command}`);
    return;
  }
  
  try {
    await handler(params);
  } catch (error) {
    console.error(`执行命令 ${command} 失败:`, error);
    message.error('操作执行失败');
  }
}

/**
 * 注册新的命令处理器
 * @param command - 命令名称
 * @param handler - 处理函数
 */
export function registerCommandHandler(command: string, handler: CommandHandler): void {
  commandHandlers[command] = handler;
}

/**
 * 获取所有已注册的命令列表
 * @returns 命令名称数组
 */
export function getAvailableCommands(): string[] {
  return Object.keys(commandHandlers);
}
