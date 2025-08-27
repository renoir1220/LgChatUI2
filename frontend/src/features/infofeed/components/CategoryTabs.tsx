/**
 * 信息流分类标签组件
 * 
 * 提供分类筛选功能，类似Perplexity的分类设计
 */

import React from 'react';
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
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {CATEGORY_CONFIGS.map((config) => {
        const isSelected = selectedCategory === config.key;
        return (
          <button
            key={config.key}
            onClick={() => onCategoryChange(config.key)}
            className={`
              inline-flex items-center gap-1.5 rounded-full whitespace-nowrap
              px-3 py-1.5 text-sm transition-colors
              ${isSelected
                ? 'bg-accent/30 text-primary ring-1 ring-primary/20'
                : 'bg-muted text-foreground/70 hover:bg-muted/80'}
            `}
            aria-pressed={isSelected}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="leading-none">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
