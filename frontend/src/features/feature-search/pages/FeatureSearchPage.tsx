import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Collapse, Empty, Spin, Tag } from 'antd';
import { LeftOutlined, SearchOutlined } from '@ant-design/icons';
import { searchFeatures, normalizeKeywords } from '../services/featureSearchApi';
import type { FeatureSearchResult } from '../types';
import { FeatureSearchResultDetail } from '../components/FeatureSearchResultDetail';
import { showApiError } from '../../shared/services/api';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractVersionSegments = (raw?: string | null): (number | string)[] => {
  if (!raw) return [];
  const normalized = raw.trim().replace(/^v/gi, '');
  if (!normalized) return [];
  return normalized
    .split(/[\.\-_]/)
    .filter(Boolean)
    .map((segment) => {
      const numeric = Number(segment);
      if (!Number.isNaN(numeric) && /^\d+$/.test(segment)) {
        return numeric;
      }
      return segment.toLowerCase();
    });
};

const compareFeatureVersionDesc = (
  a: FeatureSearchResult,
  b: FeatureSearchResult,
): number => {
  const segmentsA = extractVersionSegments(a.version);
  const segmentsB = extractVersionSegments(b.version);
  const maxLen = Math.max(segmentsA.length, segmentsB.length);

  if (maxLen > 0) {
    for (let i = 0; i < maxLen; i += 1) {
      const partA = segmentsA[i];
      const partB = segmentsB[i];

      if (partA === undefined) return 1;
      if (partB === undefined) return -1;

      if (typeof partA === 'number' && typeof partB === 'number') {
        if (partA !== partB) {
          return partB - partA;
        }
      } else {
        const strA = String(partA);
        const strB = String(partB);
        if (strA !== strB) {
          return strB.localeCompare(strA, 'zh-CN');
        }
      }
    }
  }

  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
    return dateB - dateA;
  }

  return (b.featureName || '').localeCompare(a.featureName || '', 'zh-CN');
};

const FeatureSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [keywordsInput, setKeywordsInput] = useState('');
  const [results, setResults] = useState<FeatureSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const handleSearch = async (value?: string) => {
    const next = value !== undefined ? value : keywordsInput;
    setKeywordsInput(next);
    const keywords = normalizeKeywords(next);

    if (keywords.length === 0) {
      showApiError(new Error('请先输入查询关键字'), '请输入关键字后再查询');
      return;
    }

    setLoading(true);
    setInitialized(true);

    try {
      const data = await searchFeatures(next);
      setResults(data);
    } catch (error) {
      showApiError(error, '查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const keywordGroups = useMemo(() => normalizeKeywords(keywordsInput), [keywordsInput]);

  const allKeywordsForHighlight = useMemo(() => {
    return keywordGroups.flatMap(group => group.or).filter(Boolean);
  }, [keywordGroups]);

  const highlight = useMemo(() => {
    if (allKeywordsForHighlight.length === 0) {
      return (text?: string | null) => text ?? undefined;
    }
    const unique = Array.from(new Set(allKeywordsForHighlight));
    if (unique.length === 0) {
      return (text?: string | null) => text ?? undefined;
    }
    const validKeywords = unique.filter(k => typeof k === 'string' && k.length > 0);
    if (validKeywords.length === 0) {
      return (text?: string | null) => text ?? undefined;
    }
    const pattern = new RegExp(
      `(${validKeywords.map((keyword) => escapeRegExp(keyword)).join('|')})`,
      'gi',
    );
    return (text?: string | null) => {
      if (!text) return undefined;
      const parts = text.split(pattern);
      if (parts.length === 1) {
        return text;
      }
      return parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={`hl-${index}`} style={{ color: '#dc2626' }}>
            {part}
          </span>
        ) : (
          <React.Fragment key={`hl-${index}`}>{part}</React.Fragment>
        ),
      );
    };
  }, [allKeywordsForHighlight]);

  const groupedResults = useMemo(() => {
    const map = new Map<string, FeatureSearchResult[]>();
    results.forEach((item) => {
      const key = item.productType?.trim() || '未分类';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).map(([productType, items]) => ({
      productType,
      items: [...items].sort(compareFeatureVersionDesc),
    }));
  }, [results]);

  const shouldExpandAll = results.length > 0 && results.length <= 10;

  const renderGroupLabel = (productType: string, count: number) => {
    const productTypeNode = highlight(productType) ?? productType;
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {productTypeNode}
          </span>
          <Tag color="default">{count}</Tag>
        </div>
        <span className="text-xs text-slate-500">
          点击展开查看功能明细
        </span>
      </div>
    );
  };

  const renderGroupBody = (items: FeatureSearchResult[]) => {
    const innerItems = items.map((item, index) => {
      const key =
        item.requirementCode ||
        `${item.sourceTable}-${item.featureName || index}`;

      const badges: React.ReactNode[] = [];
      const highlightedCustomer = highlight(item.customerName);
      const highlightedModule = highlight(item.moduleName);
      const highlightedSite = highlight(item.siteType);
      const versionText = item.version?.trim() ?? '';
      const versionHasPrefix = versionText.length > 0 && /^v/i.test(versionText);
      const highlightedVersion = highlight(versionText || undefined);
      const highlightedSwitch = highlight(item.parameterSwitch);
      const rawFeatureName =
        (item.featureName && item.featureName.trim().length > 0
          ? item.featureName.trim()
          : undefined) ?? '未命名功能';
      const clippedFeatureName =
        rawFeatureName.length > 50
          ? `${rawFeatureName.slice(0, 50)}…`
          : rawFeatureName;
      const highlightedFeatureName = highlight(clippedFeatureName);
      if (item.customerName) {
        badges.push(
          <Tag key="customer">{highlightedCustomer ?? item.customerName}</Tag>,
        );
      }
      if (item.moduleName) {
        badges.push(
          <Tag key="module" color="blue">
            {highlightedModule ?? item.moduleName}
          </Tag>,
        );
      }
      if (item.siteType) {
        badges.push(
          <Tag key="site" color="geekblue">
            {highlightedSite ?? item.siteType}
          </Tag>,
        );
      }
      if (versionText) {
        const versionContent = highlightedVersion ?? versionText;
        badges.push(
          <Tag key="version" color="gold">
            {versionHasPrefix ? (
              versionContent
            ) : (
              <>
                <span className="mr-0.5">v</span>
                {versionContent}
              </>
            )}
          </Tag>,
        );
      }
      badges.push(
        <Tag
          key="source"
          color={item.sourceTable === 'BUS_XQ' ? 'purple' : 'green'}
        >
          {item.sourceTable === 'BUS_XQ' ? '需求库' : '发布说明'}
        </Tag>,
      );

      return {
        key,
        label: (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-800">
                {highlightedFeatureName ?? item.featureName ?? '未命名功能'}
              </span>
              {badges}
            </div>
            {item.parameterSwitch && (
              <span className="text-xs text-slate-500">
                参数开关：{highlightedSwitch ?? item.parameterSwitch}
              </span>
            )}
          </div>
        ),
        children: <FeatureSearchResultDetail item={item} highlight={highlight} />,
      };
    });

    const defaultInnerActiveKeys = shouldExpandAll
      ? innerItems.map((innerItem) => innerItem.key)
      : undefined;

    return (
      <Collapse
        items={innerItems}
        bordered={false}
        style={{ background: 'transparent' }}
        defaultActiveKey={defaultInnerActiveKeys}
      />
    );
  };

  const groupedCollapseItems = useMemo(() => {
    return groupedResults.map(({ productType, items }) => ({
      key: productType,
      label: renderGroupLabel(productType, items.length),
      children: renderGroupBody(items),
    }));
  }, [groupedResults, renderGroupLabel, renderGroupBody]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              icon={<LeftOutlined />}
              onClick={() => navigate('/')}
              type="default"
            >
              返回
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                功能查询
              </h1>
              <p className="text-sm text-slate-500">
                支持多个关键字模糊匹配，示例：参数开关 发布说明
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-3 mb-6">
          <Input.Search
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.target.value)}
            enterButton={
              <span className="flex items-center gap-1">
                <SearchOutlined />
                查询
              </span>
            }
            size="large"
            allowClear
            placeholder="输入关键字，使用空格或逗号分隔（例如：参数开关 发布说明）"
            onSearch={(value) => handleSearch(value)}
          />
          {keywordGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>已选关键字：</span>
              {keywordGroups.map((group, groupIndex) => (
                <React.Fragment key={`keyword-group-${groupIndex}`}>
                  <div className="flex flex-wrap items-center gap-1">
                    {group.or.length > 1 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        (
                      </span>
                    )}
                    {group.or.map((keyword, orIndex) => (
                      <React.Fragment key={`keyword-${groupIndex}-${orIndex}`}>
                        <Tag color={group.or.length > 1 ? 'purple' : 'blue'}>
                          {keyword}
                        </Tag>
                        {orIndex < group.or.length - 1 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            或
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                    {group.or.length > 1 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        )
                      </span>
                    )}
                  </div>
                  {groupIndex < keywordGroups.length - 1 && (
                    <span className="text-[10px] font-medium text-slate-400">
                      且
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
              <Spin />
              <span>正在查询功能数据...</span>
            </div>
          ) : results.length > 0 ? (
            <Collapse
              items={groupedCollapseItems}
              bordered={false}
              style={{ background: 'transparent' }}
              defaultActiveKey={
                shouldExpandAll ? groupedCollapseItems.map((group) => group.key) : undefined
              }
            />
          ) : initialized ? (
            <Empty
              description="未查询到相关功能，请尝试调整关键字"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
              输入关键字并按下查询按钮，查看功能发布说明与需求资料
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FeatureSearchPage;
