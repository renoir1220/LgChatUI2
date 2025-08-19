import React, { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { RequirementDetail } from './RequirementDetail';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  User, 
  Tag,
  Clock
} from 'lucide-react';
import type { RequirementItem as RequirementItemType } from '@lg/shared';

interface RequirementItemProps {
  requirement: RequirementItemType;
  index: number;
}

/**
 * 获取状态对应的颜色
 */
function getStageColor(stage: string): string {
  const stageColorMap: Record<string, string> = {
    '需求评审': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '需求设计': 'bg-blue-100 text-blue-800 border-blue-200',
    '研发分配': 'bg-purple-100 text-purple-800 border-purple-200',
    '研发验证': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    '功能测试': 'bg-orange-100 text-orange-800 border-orange-200',
    '现场更新': 'bg-green-100 text-green-800 border-green-200',
    '产品发布': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  
  return stageColorMap[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * 单个需求项组件
 * 支持展开/收起详细内容
 */
export const RequirementItem: React.FC<RequirementItemProps> = ({
  requirement,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors duration-200">
      {/* 一级列表显示：需求编号、需求名称、最后修改时间 */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={handleToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 需求编号和状态 */}
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </Button>
              
              <span className="text-sm font-mono text-blue-600 font-medium">
                {requirement.requirementCode}
              </span>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${getStageColor(requirement.currentStage)}`}
              >
                {requirement.currentStage}
              </Badge>
            </div>

            {/* 需求名称 */}
            <h4 className="text-sm font-medium text-gray-900 mb-2 leading-relaxed">
              {/* TODO(human): 添加需求名称的多行文本截断显示功能 */}
              {requirement.requirementName || '未命名需求'}
            </h4>

            {/* 基本信息 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {requirement.product && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{requirement.product}</span>
                </div>
              )}
              
              {requirement.creator && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{requirement.creator}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>更新于 {requirement.lastUpdateDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 展开的详细内容 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <RequirementDetail requirement={requirement} />
        </div>
      )}
    </Card>
  );
};