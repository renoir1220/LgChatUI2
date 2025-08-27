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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 确保选中的分类在可视区域内
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    const selectedButton = container.querySelector('[aria-pressed="true"]') as HTMLElement;
    if (!selectedButton) return;
    
    selectedButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }, [selectedCategory]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          // 在移动端添加更多的padding，确保第一个和最后一个按钮有足够的边距
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {CATEGORY_CONFIGS.map((config) => {
          const isSelected = selectedCategory === config.key;
          return (
            <button
              key={config.key}
              onClick={() => onCategoryChange(config.key)}
              className={`
                relative inline-flex h-9 items-end gap-1.5 rounded-full whitespace-nowrap
                px-3 text-sm transition-colors pb-2 touch-manipulation
                min-w-[44px] justify-center flex-shrink-0
                ${isSelected
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/70 hover:text-foreground active:bg-muted'}
              `}
              aria-pressed={isSelected}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="text-sm">{config.icon}</span>
              <span className="leading-none">{config.label}</span>
              {/* 下划线指示器：绝对定位，不影响布局 */}
              <span
                className={`absolute left-1/2 bottom-0 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ease-out ${isSelected ? 'bg-primary w-8' : 'bg-transparent w-0'}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      
      {/* 移动端滚动提示（渐变遮罩） */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent md:hidden" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden" />
    </div>
  );
};

export default CategoryTabs;
