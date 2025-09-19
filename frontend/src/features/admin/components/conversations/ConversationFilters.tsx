import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, X, Search, CalendarIcon } from 'lucide-react';
import type { ConversationFilters } from './hooks/useAdminConversations';

interface ConversationFiltersProps {
  filters: ConversationFilters;
  onFiltersChange: (filters: Partial<ConversationFilters>) => void;
  onReset: () => void;
}

const ConversationFiltersComponent: React.FC<ConversationFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const hasActiveFilters = React.useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'feedbackFilter') return value !== 'all';
      return Boolean(value);
    });
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>筛选和搜索</span>
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>清除筛选</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {/* 搜索框 */}
          <div className="space-y-2">
            <Label htmlFor="search">搜索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="标题或用户名..."
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
                className="pl-9"
              />
            </div>
          </div>

          {/* 反馈筛选 */}
          <div className="space-y-2">
            <Label>用户反馈</Label>
            <Select
              value={filters.feedbackFilter || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  feedbackFilter: value as 'all' | 'liked' | 'disliked'
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部反馈</SelectItem>
                <SelectItem value="liked">有赞 👍</SelectItem>
                <SelectItem value="disliked">有踩 👎</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 知识库筛选 */}
          <div className="space-y-2">
            <Label>知识库</Label>
            <Select
              value={filters.knowledgeBaseId || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  knowledgeBaseId: value === 'all' ? undefined : value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择知识库" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部知识库</SelectItem>
                <SelectItem value="kb_product">产品知识库</SelectItem>
                <SelectItem value="kb_tech">技术支持库</SelectItem>
                <SelectItem value="kb_faq">常见问题库</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 时间范围 */}
          <div className="space-y-2">
            <Label>时间范围</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.startDate ? (
                      new Date(filters.startDate).toLocaleDateString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit'
                      })
                    ) : (
                      '开始'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate ? new Date(filters.startDate) : undefined}
                    onSelect={(date: Date | undefined) =>
                      onFiltersChange({
                        startDate: date?.toISOString()
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground text-sm">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.endDate ? (
                      new Date(filters.endDate).toLocaleDateString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit'
                      })
                    ) : (
                      '结束'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate ? new Date(filters.endDate) : undefined}
                    onSelect={(date: Date | undefined) =>
                      onFiltersChange({
                        endDate: date?.toISOString()
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationFiltersComponent;