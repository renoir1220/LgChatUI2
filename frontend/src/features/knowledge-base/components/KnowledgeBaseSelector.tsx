import React from 'react';
import { Select, Skeleton } from 'antd';

export interface KnowledgeBase {
  id: string;
  name: string;
}

export interface KnowledgeBaseSelectorProps {
  items: KnowledgeBase[];
  value?: string;
  loading?: boolean;
  onChange: (val?: string) => void;
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({ 
  items, 
  value, 
  loading, 
  onChange 
}) => {
  if (loading) return <Skeleton.Input active size="small" />;

  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <Select
      value={hasItems ? value : undefined}
      onChange={onChange}
      size="small"
      style={{ minWidth: 220 }}
      placeholder={hasItems ? '选择知识库' : '未配置知识库'}
      disabled={!hasItems}
      options={hasItems ? items.map(kb => ({ value: kb.id, label: kb.name })) : []}
    />
  );
};