import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { RichTextRenderer } from './RichTextRenderer';
import { 
  Calendar,
  User,
  Building,
  Tag,
  FileText,
  Settings,
  Code,
  Briefcase
} from 'lucide-react';
import type { RequirementItem } from '@lg/shared';

interface RequirementDetailProps {
  requirement: RequirementItem;
}

/**
 * 详情项组件
 */
interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value, className = "" }) => {
  if (!value || value.trim() === '') return null;
  
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500">{label}：</span>
        <span className="text-sm text-gray-700 ml-1">{value}</span>
      </div>
    </div>
  );
};

/**
 * 内容块组件
 */
interface ContentBlockProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  className?: string;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ 
  icon, 
  title, 
  content, 
  className = "" 
}) => {
  if (!content || content.trim() === '') return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <h5 className="text-sm font-medium text-gray-900">{title}</h5>
      </div>
      <div className="ml-6">
        <RichTextRenderer content={content} />
      </div>
    </div>
  );
};

/**
 * 需求详情组件
 * 展示需求的完整信息
 */
export const RequirementDetail: React.FC<RequirementDetailProps> = ({
  requirement,
}) => {
  const {
    siteName,
    product,
    content,
    requirementEvaluation,
    designContent,
    productDescription,
    developmentDescription,
    creator,
    customerName,
    versionName,
    createDate,
    lastUpdateDate,
  } = requirement;

  return (
    <div className="p-4 space-y-4 bg-gray-50/50">
      {/* 基本信息区块 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DetailItem
          icon={<Building className="h-4 w-4 text-gray-400" />}
          label="站点"
          value={siteName}
        />
        <DetailItem
          icon={<Tag className="h-4 w-4 text-gray-400" />}
          label="产品"
          value={product}
        />
        <DetailItem
          icon={<User className="h-4 w-4 text-gray-400" />}
          label="创建人"
          value={creator}
        />
        <DetailItem
          icon={<Calendar className="h-4 w-4 text-gray-400" />}
          label="创建日期"
          value={createDate}
        />
      </div>

      {/* 版本信息 */}
      {versionName && (
        <div className="pt-2 border-t border-gray-200">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            📦 {versionName}
          </Badge>
        </div>
      )}

      {/* 需求描述 */}
      <ContentBlock
        icon={<FileText className="h-4 w-4 text-blue-500" />}
        title="需求描述"
        content={content}
        className="pt-3 border-t border-gray-200"
      />

      {/* 需求评估 */}
      <ContentBlock
        icon={<Settings className="h-4 w-4 text-green-500" />}
        title="需求评估"
        content={requirementEvaluation}
      />

      {/* 设计内容 */}
      <ContentBlock
        icon={<Code className="h-4 w-4 text-purple-500" />}
        title="设计内容"
        content={designContent}
      />

      {/* 产品说明 */}
      <ContentBlock
        icon={<Briefcase className="h-4 w-4 text-orange-500" />}
        title="产品说明"
        content={productDescription}
      />

      {/* 研发说明 */}
      <ContentBlock
        icon={<Code className="h-4 w-4 text-red-500" />}
        title="研发说明"
        content={developmentDescription}
      />

      {/* 底部时间信息 */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>创建于 {createDate}</span>
          <span>最后更新 {lastUpdateDate}</span>
        </div>
      </div>
    </div>
  );
};