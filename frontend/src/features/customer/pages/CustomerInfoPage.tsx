import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabsFramework, type MenuItem } from '../../shared/components/TabsFramework';

// 客户信息菜单配置
const CUSTOMER_MENU_ITEMS: MenuItem[] = [
  {
    key: 'dynamic',
    label: '动态',
    icon: <span className="text-base">📈</span>
  },
  {
    key: 'sites',
    label: '站点',
    icon: <span className="text-base">🏢</span>
  },
  {
    key: 'workorders',
    label: '工单',
    icon: <span className="text-base">📋</span>,
    subItems: [
      { key: 'implementation', label: '实施', icon: <span className="text-sm">🔧</span> },
      { key: 'interface', label: '接口', icon: <span className="text-sm">🔌</span> }
    ]
  }
];

/**
 * 客户信息管理页面
 * 使用通用TabsFramework架构
 */
const CustomerInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dynamic');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>();

  // 处理主菜单切换
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    
    // 如果切换到工单，默认选择实施子菜单
    if (tabKey === 'workorders') {
      setActiveSubTab('implementation');
    } else {
      setActiveSubTab(undefined);
    }
  };

  // 处理子菜单切换
  const handleSubTabChange = (subTabKey: string) => {
    setActiveSubTab(subTabKey);
  };

  // 渲染内容区域
  const renderContent = (activeTab: string, activeSubTab?: string) => {
    switch (activeTab) {
      case 'dynamic':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-gray-900">客户动态</h3>
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p>客户动态内容开发中...</p>
                <p className="text-sm mt-2">这里将显示客户的最新活动、订单状态、互动记录等</p>
              </div>
            </div>
          </div>
        );

      case 'sites':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-gray-900">客户站点管理</h3>
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-4">🏢</div>
                <p>站点管理内容开发中...</p>
                <p className="text-sm mt-2">这里将显示客户的站点列表、地址信息、联系人等</p>
              </div>
            </div>
          </div>
        );

      case 'workorders':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-gray-900">
                工单管理 - {activeSubTab === 'implementation' ? '实施' : '接口'}
              </h3>
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-4">
                  {activeSubTab === 'implementation' ? '🔧' : '🔌'}
                </div>
                <p>
                  {activeSubTab === 'implementation' 
                    ? '实施工单内容开发中...' 
                    : '接口工单内容开发中...'
                  }
                </p>
                <p className="text-sm mt-2">
                  {activeSubTab === 'implementation'
                    ? '这里将显示项目实施工单、进度跟踪、任务分配等'
                    : '这里将显示接口对接工单、API调用记录、错误日志等'
                  }
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 text-center py-8">
            <p>页面开发中...</p>
          </div>
        );
    }
  };

  return (
    <TabsFramework
      menuItems={CUSTOMER_MENU_ITEMS}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onTabChange={handleTabChange}
      onSubTabChange={handleSubTabChange}
      onBackClick={() => navigate('/')}
    >
      {renderContent}
    </TabsFramework>
  );
};

export default CustomerInfoPage;