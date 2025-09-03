import React, { useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { parseActionButtons, hasActionButtons, type ActionButton } from './actionButtonParser';
import ActionButtons from '../components/ActionButtons';

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

// 行内按钮使用原生 <a> + 事件委托，避免打断 Markdown 段落结构

// 统一 Markdown 渲染（带 DOMPurify）
// 兼容旧签名：第二参可接收 boolean（是否用户消息）或对象 { isUser }
// 内部组件：负责承载 HTML、转换 Mermaid、并在需要时初始化渲染
const RenderedMarkdownContainer: React.FC<{
  html: string;
  isUser?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ html, isUser, onClick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 仅处理围栏代码块 ```mermaid ... ```，其它情况不做处理
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 1) 仅将 ```mermaid 围栏代码块转换为 div.mermaid，并附带“查看源码”
    const transformToMermaidDivs = () => {
      const codeBlocks = Array.from(
        el.querySelectorAll('pre > code.language-mermaid')
      ) as HTMLElement[];
      codeBlocks.forEach((code) => {
        const pre = code.parentElement as HTMLElement;
        const src = (code.textContent || '').trim();
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper';
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = src;
        const details = document.createElement('details');
        details.className = 'mermaid-src';
        const summary = document.createElement('summary');
        summary.textContent = '查看源码';
        const preSrc = document.createElement('pre');
        const codeSrc = document.createElement('code');
        codeSrc.className = 'language-mermaid';
        codeSrc.textContent = src;
        preSrc.appendChild(codeSrc);
        details.appendChild(summary);
        details.appendChild(preSrc);
        wrapper.appendChild(div);
        wrapper.appendChild(details);
        pre.replaceWith(wrapper);
      });
    };

    // 2) 初始化并渲染 mermaid 图
    const renderMermaid = () => {
      const anyWin = window as any;
      const mermaid = anyWin.mermaid;
      const blocks = el.querySelectorAll('.mermaid:not([data-rendered="true"])');
      if (!blocks.length) return;
      if (!mermaid) return;
      try {
        mermaid.initialize?.({
          startOnLoad: false,
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis'
          }
        });
        // 标记这些节点即将渲染，避免重复渲染
        blocks.forEach((n) => (n as HTMLElement).setAttribute('data-rendered', 'true'));

        if (typeof mermaid.run === 'function') {
          // mermaid v10+ 推荐的调用方式，返回Promise
          mermaid
            .run({ nodes: blocks })
            .catch(() => {/* 静默失败，保留源码 */});
        } else {
          // 兼容旧API
          mermaid.init?.(undefined, blocks as any);
        }
      } catch (err) {
        // 安静失败：如果渲染失败，保持源码显示
        // console.warn('Mermaid 渲染失败', err);
      }
    };

    // 如未加载 mermaid，则尝试按需加载（CDN）；加载后渲染
    const ensureMermaidLoaded = () => {
      const anyWin = window as any;
      const hasBlocks = el.querySelectorAll('.mermaid:not([data-rendered="true"])').length > 0;
      if (!hasBlocks) return; // 没有 mermaid 块时不加载脚本、也不渲染

      if (anyWin.mermaid) {
        renderMermaid();
        return;
      }
      // 避免重复插入脚本
      if (document.getElementById('mermaid-cdn-script')) {
        // 等待脚本加载后再渲染
        (document.getElementById('mermaid-cdn-script') as HTMLScriptElement).addEventListener('load', () => {
          renderMermaid();
        }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = 'mermaid-cdn-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => renderMermaid();
      // 忽略 onerror：离线或被拦截时保留源码显示
      document.body.appendChild(script);
    };

    // 由于 fenced code 只有在闭合后才会生成 language-mermaid 代码块，
    // 这里不做去抖，直接尝试一次转换+渲染即可。
    transformToMermaidDivs();
    ensureMermaidLoaded();
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`markdown-body chat-markdown-body ${isUser ? 'user-message' : ''}`}
      style={{ backgroundColor: 'transparent' }}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={onClick}
    />
  );
};

export const renderMarkdown = (
  content: string,
  options?: boolean | { isUser?: boolean }
) => {
  const cleanContent = content || '';
  const isUser = typeof options === 'boolean' ? options : !!options?.isUser;
  
  // 检查是否包含按钮代码
  const hasButtons = hasActionButtons(cleanContent);
  
  if (!hasButtons || isUser) {
    // 没有按钮或是用户消息，正常渲染
    const renderedHTML = md.render(cleanContent);
    const sanitizedHTML = DOMPurify.sanitize(renderedHTML);
    return <RenderedMarkdownContainer html={sanitizedHTML} isUser={isUser} />;
  }
  
  // 解析所有按钮
  const buttons = parseActionButtons(cleanContent);
  const blockButtons = buttons.filter(b => b.style !== 'link');
  
  // 处理内联按钮点击的函数
  const handleButtonClick = (command: string, params: Record<string, string>) => {
    import('../services/actionCommandHandler').then(({ executeCommand }) => {
      executeCommand(command, params);
    });
  };
  
  // 使用占位符策略处理内联按钮
  const buttonRegex = /\[BUTTON:([^|]+)\|([^|]+)\|([^|]*)\|?([^\]]*)\]/g;
  const buttonMap = new Map<string, { btn: ActionButton; id: number }>();
  let placeholderIndex = 0;
  
  // 第一步：替换内联按钮为占位符
  let processedContent = cleanContent.replace(buttonRegex, (fullMatch, label, command, paramString, styleString) => {
    const isLinkStyle = (() => {
      if (!styleString || !String(styleString).trim()) return false;
      try {
        const s = new URLSearchParams(styleString as string);
        return s.get('style') === 'link';
      } catch {
        return String(styleString).includes('style=link');
      }
    })();

    if (isLinkStyle) {
      // 针对每个匹配独立解析参数，避免多按钮共享同一参数的问题
      let params: Record<string, string> = {};
      if (paramString && String(paramString).trim()) {
        try {
          const usp = new URLSearchParams(paramString as string);
          params = Object.fromEntries(usp.entries());
        } catch {
          // 容错：简单按 & 和 = 切分
          params = String(paramString)
            .split('&')
            .reduce((acc: Record<string, string>, kv) => {
              const [k, v] = kv.split('=');
              if (k) acc[k] = v ?? '';
              return acc;
            }, {});
        }
      }

      // 使用对 Markdown 安全的占位符，避免下划线被解析为强调
      const id = placeholderIndex++;
      const placeholder = `@@INLINE_BTN_${id}@@`;
      const btn: ActionButton = {
        label: String(label).trim(),
        command: String(command).trim(),
        params,
        style: 'link',
      };
      buttonMap.set(placeholder, { btn, id });
      return placeholder;
    }
    // 移除非内联按钮代码，避免在markdown中显示
    return '';
  });

  // 第二步：markdown渲染
  let renderedHTML = md.render(processedContent);

  // 在消毒前，将占位符替换为真正的<a>标签，避免打断段落结构
  for (const [placeholder, { btn, id }] of buttonMap.entries()) {
    const paramsQS = new URLSearchParams(btn.params as Record<string, string>).toString();
    const anchor = `<a href=\"#\" class=\"inline-action-button\" data-inline-id=\"${id}\" data-command=\"${btn.command}\" data-params=\"${paramsQS}\">${btn.label}</a>`;
    renderedHTML = renderedHTML.split(placeholder).join(anchor);
  }

  const sanitizedHTML = DOMPurify.sanitize(renderedHTML);

  // 使用事件委托处理<a>点击，保持为行内元素
  const handleDelegatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a.inline-action-button') as HTMLAnchorElement | null;
    if (!link) return;
    e.preventDefault();
    // 记录点击位置供模态框定位
    (window as any).lastClickPosition = { x: e.clientX, y: e.clientY };
    const command = link.getAttribute('data-command') || '';
    const paramsQS = link.getAttribute('data-params') || '';
    const params = Object.fromEntries(new URLSearchParams(paramsQS).entries());
    import('../services/actionCommandHandler').then(({ executeCommand }) => {
      executeCommand(command, params);
    });
  };

  return (
    <div>
      <RenderedMarkdownContainer html={sanitizedHTML} isUser={isUser} onClick={handleDelegatedClick} />
      {blockButtons.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <ActionButtons 
            buttons={blockButtons} 
            className="justify-start" 
          />
        </div>
      )}
    </div>
  );
};
