/**
 * 操作命令处理器
 * 处理AI消息中按钮的各种命令，如页面跳转、数据导出等
 */

import { message } from 'antd';

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
    
    // 在新标签页打开
    window.open(targetUrl, '_blank');
    message.success(`正在跳转到${customerName}的站点汇总页面`);
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
    
    window.open(targetUrl, '_blank');
    message.success(`正在跳转到${customerName}的详情页面`);
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
      window.location.href = url;
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