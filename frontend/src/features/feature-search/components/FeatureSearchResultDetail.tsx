import React from 'react';
import { Tag } from 'antd';
import type { FeatureSearchResult } from '../types';

interface FeatureSearchResultDetailProps {
  item: FeatureSearchResult;
  highlight: (text?: string | null) => React.ReactNode | undefined;
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

export const FeatureSearchResultDetail: React.FC<FeatureSearchResultDetailProps> = ({ item, highlight }) => {
  const formatDateTime = (value: string | null) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const releaseNote = highlight(item.releaseNote);
  const parameterSwitch = highlight(item.parameterSwitch);

  return (
    <div className="space-y-4 bg-slate-50/60 rounded-md p-4 mt-1">
      <section className="space-y-2">
        <header className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-800">发布说明</h4>
          {item.parameterSwitch && <Tag color="processing">参数开关</Tag>}
        </header>
        <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
          {releaseNote ?? '暂无发布说明'}
        </p>
        {parameterSwitch && (
          <div className="text-xs text-slate-500">
            参数开关：{parameterSwitch}
          </div>
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
          {item.requirementContent && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">需求正文</div>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {highlight(item.requirementContent)}
              </p>
            </div>
          )}
          {item.requirementReview && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">需求评估</div>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {highlight(item.requirementReview)}
              </p>
            </div>
          )}
          {item.requirementDesign && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">需求设计</div>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {highlight(item.requirementDesign)}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default FeatureSearchResultDetail;
