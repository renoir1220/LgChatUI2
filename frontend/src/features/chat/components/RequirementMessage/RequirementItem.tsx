import React from 'react';
import { Collapse, Typography } from 'antd';
import { 
  UserOutlined, 
  TagOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { RequirementDetail } from './RequirementDetail';
import ModernTag from '../../../../components/ModernTag';
import type { RequirementItem as RequirementItemType } from "@types";

const { Text } = Typography;

interface RequirementItemProps {
  requirement: RequirementItemType;
  index: number;
}

/**
 * 获取状态对应的现代标签变体
 */
function getStageVariant(stage: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const stageVariantMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    '需求评审': 'warning',
    '需求设计': 'info',
    '研发分配': 'primary',
    '研发验证': 'info',
    '功能测试': 'warning',
    '现场更新': 'success',
    '产品发布': 'success',
  };
  
  return stageVariantMap[stage] || 'neutral';
}

/**
 * 单个需求项组件
 * 支持展开/收起详细内容
 */
export const RequirementItem: React.FC<RequirementItemProps> = ({
  requirement,
  index,
}) => {
  // 构建折叠面板的标题 - 充分利用可用宽度
  const header = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start' 
    }}>
      {/* 左侧主要信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 需求说明 - 放在最上面 */}
        <div style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: '#262626', 
          marginBottom: 6,
          lineHeight: 1.4
        }}>
          {requirement.requirementName || '未命名需求'}
        </div>
        
        {/* 标签行 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <ModernTag variant="neutral" size="small" style={{ backgroundColor: '#f0f8ff', color: '#1890ff', fontWeight: 600 }}>
            {requirement.requirementCode}
          </ModernTag>
          <ModernTag variant={getStageVariant(requirement.currentStage)} size="medium">
            {requirement.currentStage}
          </ModernTag>
          {requirement.versionName && (
            <ModernTag variant="primary" size="small" icon={<TagOutlined />}>
              {requirement.versionName}
            </ModernTag>
          )}
        </div>
        
        {/* 灰色字行 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '20px',
          fontSize: 12, 
          color: '#8c8c8c',
          flexWrap: 'wrap',
          marginBottom: 6
        }}>
          {requirement.product && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TagOutlined />
              <span>{requirement.product}</span>
            </div>
          )}
          {requirement.creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <UserOutlined />
              <span>{requirement.creator}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined />
            <span>更新于 {requirement.lastUpdateDate}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const items = [
    {
      key: requirement.requirementCode,
      label: header,
      children: <RequirementDetail requirement={requirement} />,
    },
  ];

  return (
    <Collapse
      items={items}
      ghost
      style={{ 
        marginBottom: index < 2 ? 8 : 0,
        border: 'none'
      }}
      expandIconPosition="start"
      // 自定义样式确保充分利用宽度
      className="requirement-collapse"
    />
  );
};