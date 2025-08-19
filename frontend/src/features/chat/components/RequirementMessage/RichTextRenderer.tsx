import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

/**
 * 简单文本渲染器组件
 * 用于渲染纯文本内容，保留换行符
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

  // 简单处理换行符和URL链接
  const processedContent = React.useMemo(() => {
    return content
      .split('\n')
      .map((line, index) => {
        // 检测URL链接并转换
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(line)) {
          const parts = line.split(urlRegex);
          return (
            <span key={index}>
              {parts.map((part, partIndex) => {
                if (urlRegex.test(part)) {
                  return (
                    <a
                      key={partIndex}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      🔗 查看链接
                    </a>
                  );
                }
                return part;
              })}
            </span>
          );
        }
        return <span key={index}>{line}</span>;
      });
  }, [content]);

  return (
    <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${className}`}>
      {processedContent.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < processedContent.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};