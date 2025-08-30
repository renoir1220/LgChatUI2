import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabsFramework, type MenuItem } from '../../shared/components/TabsFramework';
import { SitesSummary } from '../components/SitesSummary';
import { SitesByInstall } from '../components/SitesByInstall';

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
    icon: <span className="text-base">🏢</span>,
    subItems: [
      { key: 'summary', label: '汇总', icon: <span className="text-sm">📊</span> },
      { key: 'by-install', label: '按装机单', icon: <span className="text-sm">📋</span> }
    ]
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

export interface CustomerInfoPageProps {
  /** 客户名称（可选，如果提供则用于查询站点信息） */
  customerName?: string;
  /** 默认激活的主菜单key（可选） */
  defaultTab?: string;
  /** 默认激活的子菜单key（可选） */
  defaultSubTab?: string;
}

/**
 * 客户信息管理页面
 * 使用通用TabsFramework架构
 */
const CustomerInfoPage: React.FC<CustomerInfoPageProps> = ({
  customerName,
  defaultTab = 'dynamic',
  defaultSubTab
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(defaultSubTab);
  const [currentCustomerName, setCurrentCustomerName] = useState<string | undefined>(customerName);

  // 处理URL参数和初始化
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlCustomerName = urlParams.get('customerName');
    const urlDefaultTab = urlParams.get('defaultTab');
    const urlDefaultSubTab = urlParams.get('defaultSubTab');

    // URL参数优先级更高
    if (urlCustomerName) {
      setCurrentCustomerName(urlCustomerName);
    }
    if (urlDefaultTab) {
      setActiveTab(urlDefaultTab);
    }
    if (urlDefaultSubTab) {
      setActiveSubTab(urlDefaultSubTab);
    }
  }, [location.search]);

  // 处理主菜单切换
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    
    // 根据不同的主菜单设置默认子菜单
    if (tabKey === 'workorders') {
      setActiveSubTab('implementation');
    } else if (tabKey === 'sites') {
      setActiveSubTab('summary');
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
        // 如果有客户名称，使用客户名称查询；否则使用测试客户ID
        const displayCustomerName = currentCustomerName || '北京大学第三医院';
        const testCustomerId = 'E36139FE-FA92-4F9C-BCA0-8D88A6C5AAF9';
        
        // 站点信息页面的客户信息显示
        const customerInfoHeader = (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">当前客户：</span>
              <span className="text-blue-800 font-semibold">{displayCustomerName}</span>
            </div>
          </div>
        );

        switch (activeSubTab) {
          case 'summary':
            return (
              <div className="p-6">
                {customerInfoHeader}
                {currentCustomerName ? (
                  <SitesSummary customerName={currentCustomerName} />
                ) : (
                  <SitesSummary customerId={testCustomerId} />
                )}
              </div>
            );
          case 'by-install':
            return (
              <div className="p-6">
                {customerInfoHeader}
                {currentCustomerName ? (
                  <SitesByInstall customerName={currentCustomerName} />
                ) : (
                  <SitesByInstall customerId={testCustomerId} />
                )}
              </div>
            );
          default:
            return (
              <div className="p-6">
                {customerInfoHeader}
                {currentCustomerName ? (
                  <SitesSummary customerName={currentCustomerName} />
                ) : (
                  <SitesSummary customerId={testCustomerId} />
                )}
              </div>
            );
        }

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