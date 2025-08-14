import React, { useMemo } from 'react';
import { Citation } from './Citation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText, ExternalLink } from 'lucide-react';
import type { Citation as CitationType } from '@lg/shared';

interface CitationListProps {
  citations: CitationType[];
  className?: string;
}

interface DocumentGroup {
  document_name: string;
  source: string;
  items: CitationType[];
  count: number;
}

export function CitationList({ citations, className }: CitationListProps) {
  // 按文档分组引用
  const groupedCitations = useMemo(() => {
    if (!citations || citations.length === 0) return [];

    const groups: Map<string, DocumentGroup> = new Map();
    
    citations.forEach((citation) => {
      const key = `${citation.document_name || citation.source || '未知来源'}-${citation.source}`;
      if (groups.has(key)) {
        groups.get(key)!.items.push(citation);
      } else {
        groups.set(key, {
          document_name: citation.document_name || citation.source || '未知来源',
          source: citation.source,
          items: [citation],
          count: 0,
        });
      }
    });

    // 按位置排序并更新计数
    groups.forEach(group => {
      group.items.sort((a, b) => (b.position || 0) - (a.position || 0));
      group.count = group.items.length;
    });

    return Array.from(groups.values());
  }, [citations]);

  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-green-50 text-green-700 border-green-200', 
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-orange-50 text-orange-700 border-orange-200',
    'bg-pink-50 text-pink-700 border-pink-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
  ];

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-4 pt-3 border-t border-gray-200', className)}>
      <div className="flex items-center gap-2 mb-3">
        <ExternalLink className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">引用来源</span>
        <span className="text-xs text-gray-500">({citations.length})</span>
      </div>

      <div className="space-y-3">
        {/* 按文档分组显示 */}
        {groupedCitations.map((group, groupIndex) => {
          const colorClass = colors[groupIndex % colors.length];
          
          return (
            <div key={groupIndex} className="space-y-2">
              {/* 文档标题 */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={colorClass}>
                  <FileText className="w-3 h-3 mr-1" />
                  {group.document_name}
                  {group.count > 1 && (
                    <span className="ml-1 text-xs">({group.count})</span>
                  )}
                </Badge>
              </div>

              {/* 该文档的所有引用 */}
              <div className="flex flex-wrap gap-1 ml-4">
                {group.items.map((citation, itemIndex) => (
                  <Citation
                    key={itemIndex}
                    citation={citation}
                    position={citation.position || itemIndex + 1}
                    className={cn(
                      'text-xs',
                      colorClass.replace('bg-', 'hover:bg-').replace('text-', 'hover:text-')
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 如果引用数量较少，也可以平铺显示 */}
        {citations.length <= 3 && (
          <div className="flex flex-wrap gap-2">
            {citations.map((citation, index) => (
              <Citation
                key={index}
                citation={citation}
                position={citation.position || index + 1}
                className="text-xs"
              />
            ))}
          </div>
        )}
      </div>

      {/* 总结信息 */}
      <div className="mt-3 text-xs text-gray-500">
        基于 {groupedCitations.length} 个文档的 {citations.length} 条引用
      </div>
    </div>
  );
}