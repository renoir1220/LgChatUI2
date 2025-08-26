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
    <div className={`flex space-x-2 overflow-x-auto scrollbar-hide ${className}`}>
      {CATEGORY_CONFIGS.map((config) => {
        const isSelected = selectedCategory === config.key;
        
        return (
          <button
            key={config.key}
            onClick={() => onCategoryChange(config.key)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap
              transition-all duration-200 text-sm font-medium
              ${isSelected 
                ? config.color + ' shadow-lg transform scale-105' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            <span className="text-base">{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
