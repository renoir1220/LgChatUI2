import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { cn } from '../../shared/utils/utils';
import { Copy, FileText, Sparkles } from 'lucide-react';
import type { Citation } from "@types";

interface CitationProps {
  citation: Citation;
  position: number;
  className?: string;
}

export function Citation({ citation, position, className }: CitationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation.content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  return (
    <>
      <Badge
        variant="outline"
        className={cn(
          'cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors',
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <FileText className="w-3 h-3 mr-1" />
        {position}
      </Badge>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              引用详情 #{position}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 文档信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">文档信息</h3>
              <div className="space-y-2 text-sm">
                {citation.document_name && (
                  <div>
                    <span className="text-gray-600">文档名称：</span>
                    <span className="font-medium">{citation.document_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">来源：</span>
                  <span className="font-medium">{citation.source}</span>
                </div>
                {citation.score && (
                  <div>
                    <span className="text-gray-600">相关性评分：</span>
                    <span className="font-medium text-green-600">
                      {(citation.score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {citation.dataset_id && (
                  <div>
                    <span className="text-gray-600">数据集ID：</span>
                    <span className="font-mono text-xs bg-gray-200 px-1 rounded">
                      {citation.dataset_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 引用内容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">引用内容</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  复制
                </Button>
              </div>
              <ScrollArea className="h-64 w-full border rounded-lg">
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {citation.content}
                  </pre>
                </div>
              </ScrollArea>
            </div>

            {/* 元数据 */}
            {(citation.document_id || citation.segment_id) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">技术信息</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  {citation.document_id && (
                    <div>
                      <span className="block font-medium">文档ID</span>
                      <span className="font-mono">{citation.document_id}</span>
                    </div>
                  )}
                  {citation.segment_id && (
                    <div>
                      <span className="block font-medium">片段ID</span>
                      <span className="font-mono">{citation.segment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}