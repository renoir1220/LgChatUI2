/**
 * 路径转换工具
 * 用于将相对路径转换为完整的URL路径
 */

/**
 * 转换文本中的相对文件路径为完整URL
 * @param text 包含路径的文本内容
 * @param baseUrl 基础URL，默认为 https://crm.logene.com
 * @returns 转换后的文本
 */
export function convertRelativePathsToUrls(
  text: string | null | undefined,
  baseUrl: string = 'https://crm.logene.com',
): string {
  // 如果文本为空或null，返回空字符串
  if (!text) {
    return '';
  }

  try {
    // 匹配 ../../files/ 开头的相对路径
    // 支持多种文件扩展名：图片、文档等
    const relativePathRegex = /\.\.\/\.\.\/files\/([^"\s<>]+)/gi;

    // 将相对路径替换为完整URL
    const convertedText = text.replace(relativePathRegex, (match, filePath) => {
      // 确保路径开头没有额外的斜杠
      const cleanPath = filePath.startsWith('/')
        ? filePath.substring(1)
        : filePath;
      return `${baseUrl}/Files/Tinymce/20250813/${cleanPath}`;
    });

    return convertedText;
  } catch (error) {
    // 如果转换过程中出错，返回原始文本
    console.error('路径转换失败:', error);
    return text;
  }
}

/**
 * 批量转换对象中的文本字段路径
 * @param obj 包含文本字段的对象
 * @param textFields 需要转换的字段名数组
 * @param baseUrl 基础URL
 * @returns 转换后的对象
 */
export function convertObjectPaths<T extends Record<string, any>>(
  obj: T,
  textFields: (keyof T)[],
  baseUrl?: string,
): T {
  const convertedObj = { ...obj };

  for (const field of textFields) {
    if (typeof convertedObj[field] === 'string') {
      convertedObj[field] = convertRelativePathsToUrls(
        convertedObj[field] as string,
        baseUrl,
      ) as T[keyof T];
    }
  }

  return convertedObj;
}

/**
 * 批量转换数组中对象的文本字段路径
 * @param items 对象数组
 * @param textFields 需要转换的字段名数组
 * @param baseUrl 基础URL
 * @returns 转换后的数组
 */
export function convertArrayPaths<T extends Record<string, any>>(
  items: T[],
  textFields: (keyof T)[],
  baseUrl?: string,
): T[] {
  return items.map((item) => convertObjectPaths(item, textFields, baseUrl));
}
