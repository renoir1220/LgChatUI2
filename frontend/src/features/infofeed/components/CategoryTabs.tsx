/**
 * 信息流分类标签组件
 * 
 * 提供分类筛选功能，类似Perplexity的分类设计
 */

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { InfoFeedCategory } from '@/types/infofeed';
import type { InfoFeedCategoryConfig } from '@/types/infofeed';

interface CategoryTabsProps {
  selectedCategory: InfoFeedCategory;
  onCategoryChange: (category: InfoFeedCategory) => void;
  className?: string;
}

// 分类配置
const CATEGORY_CONFIGS: InfoFeedCategoryConfig[] = [
  {
    key: InfoFeedCategory.ALL,
    label: '所有',
    icon: '📰',
    color: 'bg-blue-500 text-white'
  },
  {
    key: InfoFeedCategory.RELATED,
    label: '与我有关',
    icon: '👤',
    color: 'bg-green-500 text-white'
  },
  {
    key: InfoFeedCategory.NEWS,
    label: '新闻',
    icon: '📡',
    color: 'bg-red-500 text-white'
  },
  {
    key: InfoFeedCategory.FEATURES,
    label: '新功能',
    icon: '🎉',
    color: 'bg-purple-500 text-white'
  },
  {
    key: InfoFeedCategory.KNOWLEDGE,
    label: '新知识',
    icon: '💡',
    color: 'bg-yellow-500 text-white'
  }
];

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Mobile: 最多显示3个分类，第4个为“更多” */}
      <div className="md:hidden px-4 w-full">
        {(() => {
          const all = CATEGORY_CONFIGS.map(c => c.key);
          // 计算可见分类（确保选中项一定包含）
          const visible: InfoFeedCategory[] = [];
          if (!visible.includes(selectedCategory)) visible.push(selectedCategory);
          for (const k of all) {
            if (visible.length >= 3) break;
            if (!visible.includes(k)) visible.push(k);
          }
          const hidden = all.filter(k => !visible.includes(k));
          return (
            <div className="grid grid-cols-4 gap-2">
              {visible.map((k) => {
                const cfg = CATEGORY_CONFIGS.find(c => c.key === k)!;
                const isSelected = selectedCategory === k;
                return (
                  <button
                    key={k}
                    onClick={() => onCategoryChange(k)}
                    className={`
                      h-9 rounded-full px-2 text-sm truncate
                      ${isSelected ? 'text-foreground font-semibold' : 'text-foreground/70 hover:text-foreground active:bg-muted'}
                    `}
                    aria-pressed={isSelected}
                    aria-current={isSelected ? 'true' : undefined}
                    title={cfg.label}
                  >
                    {cfg.label}
                  </button>
                );
              })}
              <div>
                {hidden.length > 0 && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="h-9 w-full rounded-full px-2 text-sm text-foreground/70 hover:text-foreground active:bg-muted"
                        aria-label="更多分类"
                      >
                        更多
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="min-w-[160px] rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-md">
                      {CATEGORY_CONFIGS.map((cfg) => (
                        <DropdownMenu.Item
                          key={cfg.key}
                          className={`px-2 py-1.5 rounded-sm text-sm outline-none cursor-pointer select-none ${selectedCategory === cfg.key ? 'bg-muted text-foreground' : 'text-foreground/80 hover:bg-muted'}`}
                          onSelect={(e) => { e.preventDefault(); onCategoryChange(cfg.key); }}
                        >
                          {cfg.label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Desktop: 横向滚动展示全部分类 */}
      <div className="hidden md:flex items-center px-4 md:px-6 w-full overflow-hidden min-w-0">
        {/* 横向可滚动标签（原生滚动） */}
        <div
          className="w-full overflow-x-auto overflow-y-hidden scroll-smooth whitespace-nowrap min-w-0"
          style={{
            WebkitOverflowScrolling: 'touch' as any,
            overscrollBehaviorX: 'contain',
            touchAction: 'pan-x',
          }}
        >
          <div className="inline-flex items-center gap-1.5 py-0.5 whitespace-nowrap">
            {CATEGORY_CONFIGS.map((config) => {
              const isSelected = selectedCategory === config.key;
              return (
                <button
                  key={config.key}
                  onClick={() => onCategoryChange(config.key)}
                  className={`
                    relative inline-flex h-9 items-end gap-1.5 rounded-full whitespace-nowrap
                    px-3 text-sm transition-colors pb-2 touch-manipulation
                    min-w-[44px] justify-center
                    ${isSelected
                      ? 'text-foreground font-semibold'
                      : 'text-foreground/70 hover:text-foreground active:bg-muted'}
                  `}
                  aria-pressed={isSelected}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <span className="text-sm">{config.icon}</span>
                  <span className="leading-none" title={config.label}>{config.label}</span>
                  <span
                    className={`absolute left-1/2 bottom-0 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ease-out ${isSelected ? 'bg-primary w-8' : 'bg-transparent w-0'}`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
