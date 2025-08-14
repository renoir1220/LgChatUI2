import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import type { KnowledgeBase } from '@lg/shared';

interface KnowledgeBaseSelectorProps {
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBase?: string;
  onSelectKnowledgeBase: (knowledgeBaseId?: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function KnowledgeBaseSelector({
  knowledgeBases,
  selectedKnowledgeBase,
  onSelectKnowledgeBase,
  loading = false,
  error,
  className,
}: KnowledgeBaseSelectorProps) {
  const enabledKnowledgeBases = knowledgeBases.filter(kb => kb.enabled);
  const hasKnowledgeBases = enabledKnowledgeBases.length > 0;

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onSelectKnowledgeBase(undefined);
    } else {
      onSelectKnowledgeBase(value);
    }
  };

  const selectedKb = knowledgeBases.find(kb => kb.id === selectedKnowledgeBase);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-gray-500', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>加载知识库...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-red-500', className)}>
        <AlertCircle className="w-4 h-4" />
        <span>知识库加载失败: {error}</span>
      </div>
    );
  }

  if (!hasKnowledgeBases) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-gray-500', className)}>
        <Database className="w-4 h-4" />
        <span>暂无可用知识库</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">知识库:</span>
      </div>

      <Select
        value={selectedKnowledgeBase || 'none'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-48 h-8 text-sm">
          <SelectValue>
            {selectedKb ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedKb.name}
                </Badge>
              </div>
            ) : (
              <span className="text-gray-500">选择知识库</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* 不使用知识库选项 */}
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span>不使用知识库</span>
            </div>
          </SelectItem>

          {/* 分隔线 */}
          <div className="border-t border-gray-200 my-1" />

          {/* 可用的知识库 */}
          {enabledKnowledgeBases.map((kb) => (
            <SelectItem key={kb.id} value={kb.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">{kb.name}</span>
                  {kb.description && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {kb.description}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  已启用
                </Badge>
              </div>
            </SelectItem>
          ))}

          {/* 显示被禁用的知识库 */}
          {knowledgeBases.filter(kb => !kb.enabled).length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1" />
              {knowledgeBases
                .filter(kb => !kb.enabled)
                .map((kb) => (
                  <SelectItem key={kb.id} value={kb.id} disabled>
                    <div className="flex items-center justify-between w-full opacity-50">
                      <div className="flex flex-col">
                        <span className="font-medium">{kb.name}</span>
                        {kb.description && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            {kb.description}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        已禁用
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* 显示当前选择的知识库状态 */}
      {selectedKb && (
        <div className="text-xs text-gray-500">
          已选择: {selectedKb.name}
        </div>
      )}
    </div>
  );
}