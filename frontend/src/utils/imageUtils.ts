/**
 * 图片处理工具函数
 */

// 图片基础URL，可通过环境变量配置
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost/';

/**
 * 将相对路径转换为完整的图片URL
 */
export function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // 已经是完整URL
  }
  
  // 处理相对路径，补全为完整URL
  const baseUrl = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${baseUrl}/${cleanUrl}`;
}

/**
 * 图片信息接口
 */
export interface ImageInfo {
  src: string;      // 图片原始路径
  fullUrl: string;  // 解析后的完整URL
  alt: string;      // 替代文本
}

/**
 * 从文本中提取图片信息
 * 支持多种格式：
 * - Markdown: ![alt](url)
 * - HTML: <img src="url" alt="alt" />
 * - 特殊格式: [image](url)
 * - 裸链接: https://example.com/image.jpg
 */
export function extractImagesFromText(text: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  
  // 综合正则表达式，匹配多种图片格式
  const combinedRegex = /(!\[([^\]]*)\]\(([^)]+)\))|(\[image\]\(([^)]+)\))|(\[图片\])|(<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>)|(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
  
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    let src = '';
    let alt = '';
    
    if (match[1]) {
      // Markdown format: ![alt](url)
      src = match[3];
      alt = match[2] || '图片';
    } else if (match[4]) {
      // Special format: [image](url)
      src = match[5];
      alt = '图片';
    } else if (match[6]) {
      // HTML format: <img src="url" alt="alt" />
      src = match[7];
      alt = match[8] || '图片';
    } else if (match[9]) {
      // Direct URL
      src = match[9];
      alt = '图片';
    }
    
    if (src) {
      images.push({
        src,
        fullUrl: resolveImageUrl(src),
        alt: alt || '图片'
      });
    }
  }
  
  return images;
}

/**
 * 检查文本是否只包含单个图片（可能有少量空白字符）
 */
export function isSingleImageContent(text: string): boolean {
  const trimmedText = text.trim();
  const images = extractImagesFromText(trimmedText);
  
  if (images.length !== 1) return false;
  
  // 移除图片内容后，检查剩余文本是否为空或只有空白字符
  const textWithoutImages = trimmedText
    .replace(/(!\[([^\]]*)\]\(([^)]+)\))|(\[image\]\(([^)]+)\))|(<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>)|(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi, '')
    .trim();
    
  return textWithoutImages.length === 0;
}