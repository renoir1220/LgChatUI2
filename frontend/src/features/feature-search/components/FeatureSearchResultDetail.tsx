import React from 'react';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
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
      <span className="w-16 shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="flex-1 break-words whitespace-pre-wrap text-slate-700">{value}</span>
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
            'background:rgba(219,234,254,0.9);padding:0 2px;border-radius:2px;color:#1d4ed8;font-weight:600;',
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

  const html = container.innerHTML.trim();
  return html || undefined;
};

export const FeatureSearchResultDetail: React.FC<FeatureSearchResultDetailProps> = ({
  item,
  highlight,
  keywords = [],
}) => {
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

  const isRequirementSource = React.useMemo(
    () =>
      Boolean(
        item.requirementCode ||
          item.requirementContent ||
          item.requirementReview ||
          item.requirementDesign,
      ),
    [item.requirementCode, item.requirementContent, item.requirementReview, item.requirementDesign],
  );

const formatDate = (value: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0];
};

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="font-semibold text-slate-800">发布说明</span>
          {item.parameterSwitch && (
            <Badge variant="outline" className="rounded-full border-slate-300 bg-white px-3 text-xs">
              参数开关
            </Badge>
          )}
        </header>
        {releaseNoteHtml ? (
          <div
            className="space-y-4 leading-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: releaseNoteHtml }}
          />
        ) : (
          <p className="italic text-slate-500">暂无发布说明</p>
        )}
        {parameterSwitchHtml && (
          <div
            className="text-xs leading-relaxed text-slate-500"
            dangerouslySetInnerHTML={{ __html: parameterSwitchHtml }}
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="模块" value={highlight(item.moduleName)} />
        <DetailRow label="站点" value={highlight(item.siteType)} />
        <DetailRow label="版本" value={highlight(item.version)} />
        <DetailRow label="状态" value={highlight(item.status)} />
        <DetailRow label="创建人" value={highlight(item.createdBy)} />
        <DetailRow label="发布日期" value={formatDate(item.publishedAt)} />
      </section>

      {(item.requirementContent || item.requirementReview || item.requirementDesign) && (
        <section className="space-y-4">
          {item.requirementCode && (
            <h4 className="text-sm font-semibold text-slate-800">
              需求编号：{highlight(item.requirementCode) ?? item.requirementCode}
            </h4>
          )}
          {requirementContentHtml && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求正文
              </div>
              <div
                className="space-y-4 leading-6 text-slate-700"
                dangerouslySetInnerHTML={{ __html: requirementContentHtml }}
              />
            </div>
          )}
          {requirementReviewHtml && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求评估
              </div>
              <div
                className="space-y-4 leading-6 text-slate-700"
                dangerouslySetInnerHTML={{ __html: requirementReviewHtml }}
              />
            </div>
          )}
          {requirementDesignHtml && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                需求设计
              </div>
              <div
                className="space-y-4 leading-6 text-slate-700"
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
