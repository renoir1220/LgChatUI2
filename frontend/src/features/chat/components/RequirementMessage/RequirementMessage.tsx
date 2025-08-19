import React from 'react';
import { Typography, Divider } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
    <div className="requirement-message-container">
      {/* 头部信息 - 使用简洁的排版 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 16, 
        width: '100%', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={4} style={{ margin: 0, color: '#262626' }}>需求清单({total})</Title>
          {displayCustomerName && (
            <>
              <Divider type="vertical" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">{displayCustomerName}</Text>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 需求列表 */}
      <div>
        {requirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8c8c8c' }}>
            <div>暂无需求数据</div>
          </div>
        ) : (
          <div>
            {requirements.map((requirement, index) => (
              <RequirementItem
                key={requirement.requirementCode}
                requirement={requirement}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};