import React from 'react';
import { Typography } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { RequirementItem } from './RequirementItem';
import type { RequirementListResponse } from "@types";

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
      {/* 头部信息 - 突出显示客户名称 */}
      <div style={{ 
        marginBottom: 16, 
        width: '100%'
      }}>
        {/* 客户名称 - 主要标题 */}
        {displayCustomerName && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: 8,
            gap: 8
          }}>
            <MedicineBoxOutlined style={{ 
              color: '#1890ff', 
              fontSize: 16 
            }} />
            <Title level={3} style={{ 
              margin: 0, 
              color: '#262626',
              fontWeight: 600 
            }}>
              {displayCustomerName}
            </Title>
          </div>
        )}
        
        {/* 需求清单标题 - 副标题 */}
        <div style={{ 
          paddingLeft: displayCustomerName ? 24 : 0 
        }}>
          <Text style={{ 
            fontSize: 14, 
            color: '#8c8c8c',
            fontWeight: 500
          }}>
            需求清单 ({total}条)
          </Text>
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
                total={requirements.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};