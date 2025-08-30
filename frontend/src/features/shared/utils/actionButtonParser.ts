/**
 * 通用按钮代码解析器
 * 用于解析AI回答中的操作按钮，支持跳转、导出、查看详情等功能
 * 
 * 格式: [BUTTON:按钮名称|命令|参数1=值1&参数2=值2]
 * 示例: [BUTTON:查看详情|navigate_customer_sites|customerName=无锡市人民医院]
 */

export interface ActionButton {
  /** 按钮显示文本 */
  label: string;
  /** 执行命令 */
  command: string;
  /** 命令参数 */
  params: Record<string, string>;
}

/**
 * 从消息文本中解析所有按钮代码
 * @param message - 包含按钮代码的消息文本
 * @returns 解析出的按钮数组
 */
export function parseActionButtons(message: string): ActionButton[] {
  const buttonRegex = /\[BUTTON:([^|]+)\|([^|]+)\|([^\]]+)\]/g;
  const buttons: ActionButton[] = [];
  let match;

  while ((match = buttonRegex.exec(message)) !== null) {
    const [, label, command, paramString] = match;
    
    // 解析参数字符串
    const params: Record<string, string> = {};
    if (paramString && paramString.trim()) {
      try {
        const searchParams = new URLSearchParams(paramString);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
      } catch (error) {
        console.warn('解析按钮参数失败:', paramString, error);
      }
    }

    buttons.push({
      label: label.trim(),
      command: command.trim(),
      params
    });
  }

  return buttons;
}

/**
 * 从消息中移除按钮代码，只保留纯文本内容
 * @param message - 包含按钮代码的消息文本
 * @returns 移除按钮代码后的纯文本
 */
export function removeButtonCodes(message: string): string {
  return message.replace(/\[BUTTON:[^\]]+\]/g, '').trim();
}

/**
 * 检查消息是否包含按钮代码
 * @param message - 消息文本
 * @returns 是否包含按钮代码
 */
export function hasActionButtons(message: string): boolean {
  return /\[BUTTON:[^\]]+\]/.test(message);
}