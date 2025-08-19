import React from 'react';
import { Collapse, Tag, Typography } from 'antd';
import { 
  UserOutlined, 
  TagOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { RequirementDetail } from './RequirementDetail';
import type { RequirementItem as RequirementItemType } from '@lg/shared';

const { Text } = Typography;

interface RequirementItemProps {
  requirement: RequirementItemType;
  index: number;
}

/**
 * 获取状态对应的颜色
 */
function getStageColor(stage: string): string {
  const stageColorMap: Record<string, string> = {
    '需求评审': 'warning',
    '需求设计': 'blue',
    '研发分配': 'purple',
    '研发验证': 'cyan',
    '功能测试': 'orange',
    '现场更新': 'green',
    '产品发布': 'success',
  };
  
  return stageColorMap[stage] || 'default';
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
          <Text code style={{ color: '#1890ff', fontWeight: 500, marginRight: 8 }}>
            {requirement.requirementCode}
          </Text>
          <Tag color={getStageColor(requirement.currentStage)} style={{ marginRight: 8 }}>
            {requirement.currentStage}
          </Tag>
          {requirement.versionName && (
            <Tag color="blue" style={{ fontSize: 11, marginRight: 8 }}>
              {requirement.versionName}
            </Tag>
          )}
        </div>
        
        <div style={{ 
          fontSize: 14, 
          fontWeight: 500, 
          color: '#262626', 
          marginBottom: 6,
          lineHeight: 1.4
        }}>
          {requirement.requirementName || '未命名需求'}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '20px',
          fontSize: 12, 
          color: '#8c8c8c',
          flexWrap: 'wrap'
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
      expandIconPosition="end"
      // 自定义样式确保充分利用宽度
      className="requirement-collapse"
    />
  );
};