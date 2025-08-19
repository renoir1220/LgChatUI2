import React from 'react';
import { Typography, Tag, Space, Divider } from 'antd';
import { FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { RequirementItem } from './RequirementItem';
import type { RequirementListResponse } from '@lg/shared';

const { Title, Text } = Typography;

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
    <div style={{ width: '100%', maxWidth: 'none' }}>
      {/* 头部信息 - 使用简洁的排版 */}
      <Space align="center" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: '#262626' }}>需求清单</Title>
          {displayCustomerName && (
            <>
              <Divider type="vertical" />
              <Space size={4}>
                <UserOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">{displayCustomerName}</Text>
              </Space>
            </>
          )}
        </Space>
        <Tag color="blue">共 {total} 条需求</Tag>
      </Space>

      {/* 需求列表 */}
      <div>
        {requirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8c8c8c' }}>
            <FileTextOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }} />
            <div>暂无需求数据</div>
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
    </div>
  );
};