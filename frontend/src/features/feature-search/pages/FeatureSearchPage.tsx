import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search as SearchIcon,
  Loader2,
  History,
  Flame,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/features/shared/utils/utils';
import {
  searchFeatures,
  normalizeKeywords,
  fetchUserHistory,
  fetchPopularQueries,
  fetchLatestFeatures,
} from '../services/featureSearchApi';
import type {
  FeatureSearchResult,
  FeatureSearchHistoryItem,
  FeatureSearchPopularItem,
} from '../types';
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

interface GroupedFeatureResults {
  productType: string;
  items: FeatureSearchResult[];
}

function buildGroupedResults(items: FeatureSearchResult[]): GroupedFeatureResults[] {
  const map = new Map<string, FeatureSearchResult[]>();
  items.forEach((item) => {
    const key = item.productType?.trim() || '未分类';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([productType, list]) => ({
    productType,
    items: [...list].sort(compareFeatureVersionDesc),
  }));
}

const FeatureSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const [keywordsInput, setKeywordsInput] = useState('');
  const [results, setResults] = useState<FeatureSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userHistory, setUserHistory] = useState<FeatureSearchHistoryItem[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [popularQueries, setPopularQueries] = useState<FeatureSearchPopularItem[]>([]);
  const [latestFeatures, setLatestFeatures] = useState<FeatureSearchResult[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [latestDays, setLatestDays] = useState<7 | 30>(7);

  const loadUserHistory = useCallback(async () => {
    try {
      const records = await fetchUserHistory(10);
      setUserHistory(records);
    } catch (error) {
      console.warn('加载常用查询失败', error);
    }
  }, []);

  const loadPopularQueries = useCallback(async () => {
    try {
      const items = await fetchPopularQueries(8, 30);
      setPopularQueries(items);
    } catch (error) {
      console.warn('加载热门查询失败', error);
    }
  }, []);

  const loadLatestFeatures = useCallback(async (days: 7 | 30) => {
    setLatestLoading(true);
    try {
      const data = await fetchLatestFeatures(days);
      setLatestFeatures(data);
      setLatestError(null);
    } catch (error) {
      console.warn('加载最新功能失败', error);
      const message = error instanceof Error ? error.message : '加载最新功能失败';
      setLatestError(message);
      setLatestFeatures([]);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUserHistory();
    void loadPopularQueries();
  }, [loadUserHistory, loadPopularQueries]);

  useEffect(() => {
    void loadLatestFeatures(latestDays);
  }, [loadLatestFeatures, latestDays]);

  const handleSearch = useCallback(
    async (value?: string) => {
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
        void loadUserHistory();
      } catch (error) {
        showApiError(error, '查询失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    },
    [keywordsInput, loadUserHistory],
  );

  const handleApplySavedQuery = useCallback(
    (rawKeywords: string) => {
      setHistoryModalOpen(false);
      setKeywordsInput(rawKeywords);
      void handleSearch(rawKeywords);
    },
    [handleSearch],
  );

  const handleLatestDaysChange = useCallback((value: 7 | 30) => {
    setLatestDays(value);
  }, []);

  const formatTimestamp = useCallback((value?: string | null) => {
    if (!value) return '未知时间';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }, []);

  const keywordGroups = useMemo(() => normalizeKeywords(keywordsInput), [keywordsInput]);

  const allKeywordsForHighlight = useMemo(() => {
    return keywordGroups.flatMap((group) => group.or).filter(Boolean);
  }, [keywordGroups]);

  const highlight = useMemo(() => {
    if (allKeywordsForHighlight.length === 0) {
      return (text?: string | null) => text ?? undefined;
    }
    const unique = Array.from(new Set(allKeywordsForHighlight));
    if (unique.length === 0) {
      return (text?: string | null) => text ?? undefined;
    }
    const validKeywords = unique.filter((k) => typeof k === 'string' && k.length > 0);
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
          <span
            key={`hl-${index}`}
            className="inline-flex items-center rounded-sm bg-blue-100 px-1 font-semibold text-blue-600"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={`hl-${index}`}>{part}</React.Fragment>
        ),
      );
    };
  }, [allKeywordsForHighlight]);

  const groupedResults = useMemo(() => buildGroupedResults(results), [results]);
  const latestGroupedResults = useMemo(
    () => buildGroupedResults(latestFeatures),
    [latestFeatures],
  );

  const shouldExpandAll = results.length > 0 && results.length <= 10;
  const latestShouldExpandAll = latestFeatures.length > 0 && latestFeatures.length <= 10;
  const showInitialLanding = !initialized && results.length === 0;

  const renderFeatureItems = useCallback(
    (items: FeatureSearchResult[], autoExpand = false) => {
      return (
        <div className="space-y-2">
          {items.map((item, index) => {
            const itemKey =
              item.requirementCode ||
              `${item.sourceTable || 'unknown'}-${item.featureName || index}`;

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
              rawFeatureName.length > 50 ? `${rawFeatureName.slice(0, 50)}…` : rawFeatureName;
            const highlightedFeatureName = highlight(clippedFeatureName);

            if (item.customerName) {
              badges.push(
                <Badge
                  key="customer"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-600"
                >
                  客户：{highlightedCustomer ?? item.customerName}
                </Badge>,
              );
            }
            if (item.moduleName) {
              badges.push(
                <Badge
                  key="module"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-600"
                >
                  模块：{highlightedModule ?? item.moduleName}
                </Badge>,
              );
            }
            if (item.siteType) {
              badges.push(
                <Badge
                  key="site"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-600"
                >
                  站点：{highlightedSite ?? item.siteType}
                </Badge>,
              );
            }
            if (versionText) {
              const versionContent = highlightedVersion ?? versionText;
              badges.push(
                <Badge
                  key="version"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-600"
                >
                  版本：
                  {versionHasPrefix ? (
                    versionContent
                  ) : (
                    <>
                      <span className="mr-0.5">v</span>
                      {versionContent}
                    </>
                  )}
                </Badge>,
              );
            }

            badges.push(
              <Badge
                key="source"
                variant="secondary"
                className="rounded-full border border-slate-200 bg-indigo-50 px-3 text-xs font-medium text-indigo-600"
              >
                来源：{highlight(item.sourceTable) ?? item.sourceTable ?? '—'}
              </Badge>,
            );

            const defaultOpen = autoExpand;

            return (
              <Collapsible
                key={itemKey}
                defaultOpen={defaultOpen}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <CollapsibleTrigger className="group flex w-full flex-col gap-2 rounded-xl px-4 py-3 text-left transition hover:bg-blue-50/40 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {highlightedFeatureName ?? item.featureName ?? '未命名功能'}
                    </span>
                    {badges.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {badges}
                      </div>
                    )}
                  </div>
                  {item.parameterSwitch && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-300 bg-slate-50 px-3 text-[11px] font-medium text-slate-600"
                    >
                      参数开关：{highlightedSwitch ?? item.parameterSwitch}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-blue-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-slate-200 px-4 pb-4 pt-4">
                  <FeatureSearchResultDetail
                    item={item}
                    highlight={highlight}
                    keywords={allKeywordsForHighlight}
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      );
    },
    [allKeywordsForHighlight, highlight],
  );

  const renderGroupedResultSections = useMemo(() => {
    return groupedResults.map(({ productType, items }) => {
      const productTypeNode = highlight(productType) ?? productType;
      const forceExpandDetails = items.length <= 3;

      return (
        <Collapsible
          key={productType}
          defaultOpen={shouldExpandAll}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 shadow-sm"
        >
          <CollapsibleTrigger className="group flex w-full flex-col gap-3 bg-white/80 px-5 py-4 text-left text-base font-semibold text-slate-900 transition hover:bg-blue-50/60 data-[state=open]:bg-blue-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                {productType.slice(0, 1)}
              </span>
              <span>{productTypeNode}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <Badge
                variant="secondary"
                className="rounded-full border border-blue-100 bg-white px-3 text-xs font-semibold text-blue-600"
              >
                {items.length} 条记录
              </Badge>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5 pt-3">
            {renderFeatureItems(items, shouldExpandAll || forceExpandDetails)}
          </CollapsibleContent>
        </Collapsible>
      );
    });
  }, [groupedResults, highlight, renderFeatureItems, shouldExpandAll]);

  const renderLatestSections = useMemo(() => {
    if (latestGroupedResults.length === 0) {
      return null;
    }
    return latestGroupedResults.map(({ productType, items }) => {
      const forceExpandDetails = items.length <= 3;

      return (
      <Collapsible
        key={`latest-${productType}`}
        defaultOpen={latestShouldExpandAll}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <CollapsibleTrigger className="group flex w-full flex-col gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-blue-50/40 data-[state=open]:bg-blue-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              {productType.slice(0, 1)}
            </span>
            <span>{productType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border border-blue-100 bg-white px-2.5 text-[11px] font-semibold text-blue-600"
            >
              {items.length} 条记录
            </Badge>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 pt-2">
          {renderFeatureItems(items, latestShouldExpandAll || forceExpandDetails)}
        </CollapsibleContent>
      </Collapsible>
    );
  });
  }, [latestGroupedResults, renderFeatureItems, latestShouldExpandAll]);

  return (
    <div className="min-h-screen bg-slate-50/90 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:px-8">
        <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">功能查询</h1>
            <p className="text-sm text-slate-500">
              数据来源：需求管理（新）与 README
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </header>

        <Card className="border-slate-200 bg-white/95 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1">
                <Input
                  value={keywordsInput}
                  onChange={(event) => setKeywordsInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSearch(event.currentTarget.value);
                    }
                  }}
                  placeholder="输入关键字。例如：收费 接口, 参数开关/发布说明"
                  className="h-11 rounded-lg border-slate-200 bg-white pr-10 text-base shadow-sm focus-visible:ring-blue-500"
                />
                {keywordsInput && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    onClick={() => setKeywordsInput('')}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">清空关键字</span>
                  </button>
                )}
              </div>
              <Button
                onClick={() => void handleSearch()}
                className="h-11 rounded-lg px-5 text-base"
              >
                <SearchIcon className="h-4 w-4" />
                查询
              </Button>
            </div>

            {keywordGroups.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>已选关键字：</span>
                {keywordGroups.map((group, groupIndex) => (
                  <React.Fragment key={`keyword-group-${groupIndex}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {group.or.length > 1 && (
                        <span className="text-[11px] font-semibold text-slate-400">(</span>
                      )}
                      {group.or.map((keyword, orIndex) => (
                        <React.Fragment key={`keyword-${groupIndex}-${orIndex}`}>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'rounded-full border border-slate-200 bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-600',
                              group.or.length > 1 &&
                                'border-indigo-200 bg-indigo-50 text-indigo-600',
                            )}
                          >
                            {keyword}
                          </Badge>
                          {orIndex < group.or.length - 1 && (
                            <span className="text-[11px] font-medium text-slate-400">或</span>
                          )}
                        </React.Fragment>
                      ))}
                      {group.or.length > 1 && (
                        <span className="text-[11px] font-semibold text-slate-400">)</span>
                      )}
                    </div>
                    {groupIndex < keywordGroups.length - 1 && (
                      <span className="text-[11px] font-medium text-slate-400">且</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {userHistory.length > 0 && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="text-xs font-semibold text-slate-600">常用查询</div>
                <div className="flex flex-wrap items-center gap-2">
                  {userHistory.slice(0, 3).map((item, index) => (
                    <Button
                      key={`${item.rawKeywords}-${index}`}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1.5 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
                      onClick={() => handleApplySavedQuery(item.rawKeywords)}
                    >
                      <History className="h-3.5 w-3.5" />
                      {item.rawKeywords}
                    </Button>
                  ))}
                  {userHistory.length > 3 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0 text-blue-600"
                      onClick={() => setHistoryModalOpen(true)}
                    >
                      更多
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showInitialLanding && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-semibold">最新功能</CardTitle>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-1 py-0.5">
                  {[7, 30].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={latestDays === value ? 'default' : 'ghost'}
                      className={cn(
                        'h-7 rounded-full px-3 text-[12px]',
                        latestDays === value
                          ? 'shadow-sm'
                          : 'text-slate-600 hover:text-slate-800',
                      )}
                      onClick={() => handleLatestDaysChange(value as 7 | 30)}
                    >
                      近{value}天
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                {latestLoading ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    正在加载最新功能...
                  </div>
                ) : latestError ? (
                  <div className="rounded-lg border border-dashed border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-500">
                    {latestError}
                  </div>
                ) : latestFeatures.length > 0 ? (
                  renderLatestSections
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-sm text-slate-500">
                    <Sparkles className="h-5 w-5 text-slate-400" />
                    暂无新功能
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">热门查询</CardTitle>
                </div>
                <span className="text-xs text-slate-400">近30天</span>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {popularQueries.length > 0 ? (
                  <ol className="space-y-2">
                    {popularQueries.map((item, index) => (
                      <li key={`${item.rawKeywords}-${item.lastUsedAt}`}>
                        <button
                          type="button"
                          onClick={() => handleApplySavedQuery(item.rawKeywords)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {index + 1}
                            </span>
                            <span className="truncate">{item.rawKeywords}</span>
                          </span>
                          <span className="text-xs text-slate-400">{item.usageCount} 次</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-sm text-slate-500">
                    <Flame className="h-5 w-5 text-slate-400" />
                    暂无热门查询
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!showInitialLanding && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-16 text-sm text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span>正在查询功能数据...</span>
                </div>
              ) : results.length > 0 ? (
                renderGroupedResultSections
              ) : initialized ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-sm text-slate-500">
                  <Sparkles className="h-6 w-6 text-slate-400" />
                  <span>未查询到相关功能，请尝试调整关键字</span>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
                  输入关键字并按下查询按钮，查看功能发布说明与需求资料
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>常用查询记录</DialogTitle>
          </DialogHeader>
          {userHistory.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">暂无查询记录</div>
          ) : (
            <ScrollArea className="max-h-[360px] pr-3">
              <div className="space-y-3 py-1">
                {userHistory.map((item) => (
                  <div
                    key={`${item.rawKeywords}-${item.lastUsedAt}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{item.rawKeywords}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatTimestamp(item.lastUsedAt)}
                        {item.resultCount !== null ? ` · 返回 ${item.resultCount} 条` : ''}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0 text-blue-600"
                      onClick={() => handleApplySavedQuery(item.rawKeywords)}
                    >
                      立即查询
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureSearchPage;
