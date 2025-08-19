import React from 'react';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { RequirementItem } from './RequirementItem';
import { FileText, Calendar, User } from 'lucide-react';
import type { RequirementListResponse } from '@lg/shared';

interface RequirementMessageProps {
  data: RequirementListResponse;
  customerName?: string;
}

/**
 * 需求列表消息组件
 * 用于在聊天界面中展示需求清单
 */
export const RequirementMessage: React.FC<RequirementMessageProps> = ({
  data,
  customerName,
}) => {
  const { requirements, total } = data;
  
  // 提取客户名称（从第一条需求中获取，如果没有传入）
  const displayCustomerName = customerName || 
    (requirements.length > 0 ? requirements[0].customerName : '未知客户');

  return (
    <Card className="max-w-full p-0 border-0 shadow-none bg-transparent">
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">需求清单</h3>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            共 {total} 条需求
          </Badge>
        </div>
        
        {displayCustomerName && (
          <div className="flex items-center gap-2 mt-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">客户：{displayCustomerName}</span>
          </div>
        )}
      </div>

      {/* 需求列表 */}
      <div className="space-y-3">
        {requirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无需求数据</p>
          </div>
        ) : (
          requirements.map((requirement, index) => (
            <RequirementItem
              key={requirement.requirementCode}
              requirement={requirement}
              index={index}
            />
          ))
        )}
      </div>
      
      {/* 底部提示 */}
      {requirements.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>点击需求项查看详细内容</span>
          </div>
        </div>
      )}
    </Card>
  );
};