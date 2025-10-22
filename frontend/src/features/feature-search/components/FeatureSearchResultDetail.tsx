import React from 'react';
import { Tag } from 'antd';
import DOMPurify from 'dompurify';
import type { FeatureSearchResult } from '../types';

interface FeatureSearchResultDetailProps {
  item: FeatureSearchResult;
  highlight: (text?: string | null) => React.ReactNode | undefined;
  keywords?: string[];
}

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-slate-600">
      <span className="w-20 shrink-0 text-slate-500">{label}</span>
      <span className="flex-1 break-words whitespace-pre-wrap">{value}</span>
    </div>
  );
};

const IMAGE_BASE_URL = 'https://crm.logene.com/';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toAbsoluteImageSrc = (src: string) => {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) {
    return src;
  }
  const cleaned = src.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');
  if (cleaned.startsWith('/')) {
    return `${IMAGE_BASE_URL.replace(/\/$/g, '')}${cleaned}`;
  }
  return `${IMAGE_BASE_URL.replace(/\/$/g, '')}/${cleaned}`;
};

const HEADING_STYLES: Record<string, string> = {
  h1: 'font-size:20px;font-weight:600;color:#111827;margin:18px 0 10px;padding-left:8px;border-left:3px solid #2563eb;',
  h2: 'font-size:18px;font-weight:600;color:#1f2937;margin:16px 0 8px;padding-left:6px;border-left:3px solid rgba(37,99,235,0.65);',
  h3: 'font-size:16px;font-weight:600;color:#1f2937;margin:14px 0 8px;padding-left:6px;border-left:2px solid rgba(37,99,235,0.35);',
  h4: 'font-size:15px;font-weight:600;color:#374151;margin:12px 0 6px;',
  h5: 'font-size:14px;font-weight:600;color:#4b5563;margin:10px 0 6px;',
  h6: 'font-size:13px;font-weight:600;color:#6b7280;margin:8px 0 4px;',
};

const sanitizeRichText = (content: string | null | undefined, keywords: string[] = []) => {
  if (!content || content.trim() === '') {
    return undefined;
  }

  const hasHtmlTags = /<[^>]+>/.test(content);
  const normalized = hasHtmlTags ? content : content.replace(/\n/g, '<br />');

  const sanitized = DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: [
      'a', 'br', 'div', 'span', 'p', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'img', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'mark'
    ],
    ALLOWED_ATTR: ['href', 'src', 'target', 'rel', 'alt', 'title', 'style', 'class'],
    ADD_ATTR: ['loading'],
    KEEP_CONTENT: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
  const container = doc.body || doc.createElement('div');

  // 处理图片：补全链接，增加缩略样式，并可点击放大
  container.querySelectorAll('img').forEach((img) => {
    const originalSrc = img.getAttribute('src') || '';
    const absoluteSrc = toAbsoluteImageSrc(originalSrc);
    img.setAttribute('src', absoluteSrc);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('alt', img.getAttribute('alt') || '需求附件');

    const existingStyle = img.getAttribute('style') || '';
    const mergedStyle = [
      existingStyle,
      'max-width:100%',
      'max-height:320px',
      'object-fit:contain',
      'border-radius:6px',
      'box-shadow:0 0 0 1px rgba(148,163,184,0.25)',
      'cursor:zoom-in',
      'background:#fff',
    ]
      .filter(Boolean)
      .join(';');
    img.setAttribute('style', mergedStyle);

    const parent = img.parentElement;
    if (!parent || parent.tagName.toLowerCase() !== 'a') {
      const wrapper = doc.createElement('a');
      wrapper.setAttribute('href', absoluteSrc);
      wrapper.setAttribute('target', '_blank');
      wrapper.setAttribute('rel', 'noopener noreferrer');
      wrapper.setAttribute(
        'style',
        'display:inline-flex;margin:6px 0;max-width:100%;justify-content:center;',
      );
      img.replaceWith(wrapper);
      wrapper.appendChild(img);
    } else {
      parent.setAttribute('href', absoluteSrc);
      parent.setAttribute('target', '_blank');
      parent.setAttribute('rel', 'noopener noreferrer');
      const parentStyle = parent.getAttribute('style') || '';
      parent.setAttribute(
        'style',
        `${parentStyle};display:inline-flex;margin:6px 0;max-width:100%;justify-content:center;`,
      );
    }
  });

  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const tagName = heading.tagName.toLowerCase();
    const existingStyle = heading.getAttribute('style') || '';
    const additionalStyle = HEADING_STYLES[tagName] || '';
    heading.setAttribute('style', `${existingStyle};${additionalStyle}`);
  });

  container.querySelectorAll('p').forEach((paragraph) => {
    const existingStyle = paragraph.getAttribute('style') || '';
    paragraph.setAttribute(
      'style',
      `${existingStyle};margin:8px 0;color:#374151;line-height:1.65;`,
    );
  });

  container.querySelectorAll('ul, ol').forEach((list) => {
    const existingStyle = list.getAttribute('style') || '';
    list.setAttribute('style', `${existingStyle};margin:8px 0 8px 20px;`);
  });

  // 高亮关键字
  const effectiveKeywords = Array.from(
    new Set(keywords.filter(Boolean).map((keyword) => keyword.trim())),
  );
  if (effectiveKeywords.length > 0) {
    const escaped = effectiveKeywords.map(escapeRegExp).filter(Boolean);
    if (escaped.length > 0) {
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      const pending: Text[] = [];

      let current = walker.nextNode();
      while (current) {
        pending.push(current as Text);
        current = walker.nextNode();
      }

      pending.forEach((textNode) => {
        const textValue = textNode.nodeValue;
        if (!textValue || !regex.test(textValue)) {
          return;
        }
        regex.lastIndex = 0;

        const fragment = doc.createDocumentFragment();
        let lastIndex = 0;
        textValue.replace(regex, (match, _p1, offset: number) => {
          if (offset > lastIndex) {
            fragment.appendChild(doc.createTextNode(textValue.slice(lastIndex, offset)));
          }
          const mark = doc.createElement('mark');
          mark.textContent = textValue.slice(offset, offset + match.length);
          mark.setAttribute(
            'style',
            'background:rgba(250,204,21,0.35);padding:0 2px;border-radius:2px;',
          );
          fragment.appendChild(mark);
          lastIndex = offset + match.length;
          return match;
        });
        if (lastIndex < textValue.length) {
          fragment.appendChild(doc.createTextNode(textValue.slice(lastIndex)));
        }
        textNode.parentNode?.replaceChild(fragment, textNode);
      });
    }
  }

  const html = container.innerHTML
    .replace(/<div>&nbsp;<\/div>/g, '<div style="height:0.75rem;"></div>')
    .trim();

  return html || undefined;
};

export const FeatureSearchResultDetail: React.FC<FeatureSearchResultDetailProps> = ({
  item,
  highlight,
  keywords = [],
}) => {
  const formatDateTime = (value: string | null) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const releaseNoteHtml = React.useMemo(
    () => sanitizeRichText(item.releaseNote, keywords),
    [item.releaseNote, keywords],
  );

  const parameterSwitchHtml = React.useMemo(
    () => sanitizeRichText(item.parameterSwitch, keywords),
    [item.parameterSwitch, keywords],
  );

  const requirementContentHtml = React.useMemo(
    () => sanitizeRichText(item.requirementContent, keywords),
    [item.requirementContent, keywords],
  );

  const requirementReviewHtml = React.useMemo(
    () => sanitizeRichText(item.requirementReview, keywords),
    [item.requirementReview, keywords],
  );

  const requirementDesignHtml = React.useMemo(
    () => sanitizeRichText(item.requirementDesign, keywords),
    [item.requirementDesign, keywords],
  );

  return (
    <div className="space-y-4 bg-slate-50/60 rounded-md p-4 mt-1">
      <section className="space-y-2">
        <header className="flex items-center gap-2 text-slate-700">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            发布说明
          </h3>
          {item.parameterSwitch && <Tag color="processing">参数开关</Tag>}
        </header>
        {releaseNoteHtml ? (
          <div
            className="text-sm leading-6 text-slate-700 space-y-4 richtext-content"
            dangerouslySetInnerHTML={{ __html: releaseNoteHtml }}
          />
        ) : (
          <p className="text-sm text-slate-500 italic">暂无发布说明</p>
        )}
        {parameterSwitchHtml && (
          <div
            className="text-xs text-slate-500 richtext-content"
            dangerouslySetInnerHTML={{ __html: parameterSwitchHtml }}
          />
        )}
      </section>

      <section className="grid gap-2 md:grid-cols-2">
        <DetailRow label="客户" value={highlight(item.customerName) ?? '—'} />
        <DetailRow label="模块" value={highlight(item.moduleName) ?? '—'} />
        <DetailRow label="站点" value={highlight(item.siteType) ?? '—'} />
        <DetailRow label="版本" value={highlight(item.version) ?? '—'} />
        <DetailRow label="产品类型" value={highlight(item.productType) ?? '—'} />
        <DetailRow
          label="来源"
          value={item.sourceTable === 'BUS_XQ' ? '需求库' : '发布说明'}
        />
        <DetailRow
          label="状态"
          value={highlight(item.status) ?? (item.sourceTable === 'BUS_XQ' ? '—' : undefined)}
        />
        <DetailRow label="创建人" value={highlight(item.createdBy)} />
        <DetailRow label="创建时间" value={formatDateTime(item.createdAt)} />
      </section>

      {(item.requirementContent || item.requirementReview || item.requirementDesign) && (
        <section className="space-y-3">
          {item.requirementCode && (
            <h4 className="text-sm font-semibold text-slate-800">
              需求编号：{highlight(item.requirementCode) ?? item.requirementCode}
            </h4>
          )}
          {requirementContentHtml && (
            <div>
              <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求正文
              </div>
              <div
                className="text-sm leading-6 text-slate-700 space-y-4 richtext-content"
                dangerouslySetInnerHTML={{ __html: requirementContentHtml }}
              />
            </div>
          )}
          {requirementReviewHtml && (
            <div>
              <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求评估
              </div>
              <div
                className="text-sm leading-6 text-slate-700 space-y-4 richtext-content"
                dangerouslySetInnerHTML={{ __html: requirementReviewHtml }}
              />
            </div>
          )}
          {requirementDesignHtml && (
            <div>
              <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求设计
              </div>
              <div
                className="text-sm leading-6 text-slate-700 space-y-4 richtext-content"
                dangerouslySetInnerHTML={{ __html: requirementDesignHtml }}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default FeatureSearchResultDetail;
