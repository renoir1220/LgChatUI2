import React from 'react';
import { Collapse, Tag, Space, Typography } from 'antd';
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
  // 构建折叠面板的标题 - 使用更宽的布局
  const header = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      {/* 左侧主要信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text code style={{ color: '#1890ff', fontWeight: 500 }}>
            {requirement.requirementCode}
          </Text>
          <Tag color={getStageColor(requirement.currentStage)}>
            {requirement.currentStage}
          </Tag>
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
        
        <Space size={20} style={{ fontSize: 12, color: '#8c8c8c' }} wrap>
          {requirement.product && (
            <Space size={4}>
              <TagOutlined />
              <span>{requirement.product}</span>
            </Space>
          )}
          {requirement.creator && (
            <Space size={4}>
              <UserOutlined />
              <span>{requirement.creator}</span>
            </Space>
          )}
          <Space size={4}>
            <ClockCircleOutlined />
            <span>更新于 {requirement.lastUpdateDate}</span>
          </Space>
        </Space>
      </div>
      
      {/* 右侧补充信息（如果需要） */}
      <div style={{ marginLeft: 16, flexShrink: 0 }}>
        {requirement.versionName && (
          <Tag color="blue" style={{ fontSize: 11 }}>
            {requirement.versionName}
          </Tag>
        )}
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
        border: 'none',
        width: '100%'
      }}
      expandIconPosition="end"
      // 自定义样式确保充分利用宽度
      className="requirement-collapse"
    />
  );
};