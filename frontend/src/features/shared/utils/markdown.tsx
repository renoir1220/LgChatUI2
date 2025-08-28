import React from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// 统一的 Markdown 渲染与 think 标签解析工具
// 注意：仅提供纯逻辑与安全处理，样式类名保持与现有实现一致

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
});

export interface ThinkParseResult {
  hasThink: boolean;
  closed: boolean; // 是否找到闭合的 </think>
  thinkText: string;
  finalText: string; // 移除 <think> 后用于最终显示的文本
  previewText: string; // 流式阶段未闭合时可见的片段
}

// 解析 <think> … </think>
export const parseThinkMarkup = (raw: string): ThinkParseResult => {
  if (!raw) return { hasThink: false, closed: false, thinkText: '', finalText: '', previewText: '' };
  const openIdx = raw.search(/<think>/i);
  const closeIdx = raw.search(/<\/think>/i);
  const hasOpen = openIdx !== -1;
  const hasClose = closeIdx !== -1;
  if (!hasOpen) {
    return { hasThink: false, closed: false, thinkText: '', finalText: raw, previewText: raw };
  }
  if (hasOpen && !hasClose) {
    const previewText = raw.slice(0, openIdx).trimEnd();
    return { hasThink: true, closed: false, thinkText: '', finalText: '', previewText };
  }
  const thinkRegex = /<think>[\s\S]*?<\/think>/gi;
  const firstThink = /<think>([\s\S]*?)<\/think>/i.exec(raw);
  const thinkText = firstThink?.[1] ?? '';
  const finalText = raw.replace(thinkRegex, '').trimStart();
  return { hasThink: true, closed: true, thinkText, finalText, previewText: finalText };
};

// 统一 Markdown 渲染（带 DOMPurify）
// 兼容旧签名：第二参可接收 boolean（是否用户消息）或对象 { isUser }
export const renderMarkdown = (
  content: string,
  options?: boolean | { isUser?: boolean }
) => {
  const renderedHTML = md.render(content || '');
  const sanitizedHTML = DOMPurify.sanitize(renderedHTML);
  const isUser = typeof options === 'boolean' ? options : !!options?.isUser;
  return (
    <div
      className={`markdown-body chat-markdown-body ${isUser ? 'user-message' : ''}`}
      style={{ backgroundColor: 'transparent' }}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};
