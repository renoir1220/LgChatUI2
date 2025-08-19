import React from 'react';
import DOMPurify from 'dompurify';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

/**
 * 富文本渲染器组件
 * 用于渲染包含HTML标签的内容，支持安全的HTML渲染
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content || content.trim() === '') {
    return (
      <div className="text-sm text-gray-500 italic">
        暂无内容
      </div>
    );
  }

  // 处理HTML内容
  const processedContent = React.useMemo(() => {
    // 检测是否包含HTML标签
    const hasHtmlTags = /<[^>]+>/.test(content);
    
    if (hasHtmlTags) {
      // 配置DOMPurify，允许安全的HTML标签和属性
      const cleanHtml = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['div', 'p', 'br', 'img', 'a', 'span', 'strong', 'b', 'em', 'i', 'u'],
        ALLOWED_ATTR: ['src', 'href', 'target', 'rel', 'alt', 'title', 'class', 'style'],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      });

      // 处理空白元素
      const processedHtml = cleanHtml
        .replace(/<div>&nbsp;<\/div>/g, '<div style="height: 1em;"></div>') // 处理空白div
        .replace(/<div><\/div>/g, '<div style="height: 1em;"></div>'); // 处理空div

      return processedHtml;
    } else {
      // 纯文本处理，保留换行符
      return content.replace(/\n/g, '<br>');
    }
  }, [content]);

  return (
    <div 
      className={`text-sm text-gray-700 leading-relaxed ${className}`}
      style={{ lineHeight: '1.6' }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};