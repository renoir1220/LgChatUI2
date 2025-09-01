import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabsFramework, type MenuItem } from '../../shared/components/TabsFramework';
import { SitesSummary } from '../components/SitesSummary';
import { SitesByInstall } from '../components/SitesByInstall';
import { CurrentCustomerBar } from '../components/CurrentCustomerBar';
import { DictionarySelector } from '../../shared/components/DictionarySelector';
import { useCustomerDict } from '../../shared/hooks/useCustomerDict';
import type { DictionaryItem } from '../../shared/components/DictionarySelector';

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
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [rightContent, setRightContent] = useState<React.ReactNode>(null);
  
  // 使用客户字典Hook
  const { dictionaries } = useCustomerDict();

  // 获取当前页面标题 - 一级标题 | 二级标题（若有）
  const getPageTitle = (tab: string, subTab?: string): string => {
    const menuItem = CUSTOMER_MENU_ITEMS.find(item => item.key === tab);
    if (!menuItem) return '';

    let title = menuItem.label;
    
    if (subTab && menuItem.subItems) {
      const subMenuItem = menuItem.subItems.find(sub => sub.key === subTab);
      if (subMenuItem) {
        title += ` | ${subMenuItem.label}`;
      }
    }
    
    return title;
  };

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

  // 处理右侧内容清空（非站点页面）
  useEffect(() => {
    if (activeTab !== 'sites') {
      setRightContent(null);
    }
  }, [activeTab, activeSubTab]);

  // 处理客户选择
  const handleSelectCustomer = () => {
    setIsCustomerSelectorOpen(true);
  };

  // 处理客户字典选择
  const handleCustomerDictionarySelect = (dictionary: DictionaryItem) => {
    setIsCustomerSelectorOpen(false);
    setCurrentCustomerName(dictionary.customerName);
    
    // 更新URL参数
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('customerName', dictionary.customerName);
    window.history.replaceState({}, '', newUrl.toString());
  };

  // 如果没有选择客户，则不显示内容，提示选择客户
  if (!currentCustomerName) {
    return (
      <>
        <TabsFramework
          menuItems={CUSTOMER_MENU_ITEMS}
          activeTab={activeTab}
          activeSubTab={activeSubTab}
          onTabChange={handleTabChange}
          onSubTabChange={handleSubTabChange}
          onBackClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate('/');
            }
          }}
          headerContent={
            <CurrentCustomerBar 
              customerName={undefined}
              onSelectCustomer={handleSelectCustomer}
              pageTitle={getPageTitle(activeTab, activeSubTab)}
              rightContent={rightContent}
            />
          }
        >
          {() => (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">选择客户查看信息</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                请先选择一个客户，然后查看该客户的相关信息和数据
              </p>
              <button
                onClick={handleSelectCustomer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                选择客户
              </button>
            </div>
          )}
        </TabsFramework>

        {/* 客户字典选择器 */}
        <DictionarySelector
          dictionaries={dictionaries}
          isOpen={isCustomerSelectorOpen}
          onSelect={handleCustomerDictionarySelect}
          onClose={() => setIsCustomerSelectorOpen(false)}
          title="选择客户"
        />
      </>
    );
  }

  // 渲染内容区域
  const renderContent = (activeTab: string, activeSubTab?: string) => {
    switch (activeTab) {
      case 'dynamic':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
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
        const testCustomerId = 'E36139FE-FA92-4F9C-BCA0-8D88A6C5AAF9';

        switch (activeSubTab) {
          case 'summary':
            return (
              <div className="space-y-6">
                {currentCustomerName ? (
                  <SitesSummary 
                    customerName={currentCustomerName} 
                    onRenderRightContent={setRightContent}
                  />
                ) : (
                  <SitesSummary 
                    customerId={testCustomerId} 
                    onRenderRightContent={setRightContent}
                  />
                )}
              </div>
            );
          case 'by-install':
            return (
              <div className="space-y-6">
                {currentCustomerName ? (
                  <SitesByInstall 
                    customerName={currentCustomerName}
                    onRenderRightContent={setRightContent}
                  />
                ) : (
                  <SitesByInstall 
                    customerId={testCustomerId}
                    onRenderRightContent={setRightContent}
                  />
                )}
              </div>
            );
          default:
            return (
              <div className="space-y-6">
                {currentCustomerName ? (
                  <SitesSummary 
                    customerName={currentCustomerName}
                    onRenderRightContent={setRightContent}
                  />
                ) : (
                  <SitesSummary 
                    customerId={testCustomerId}
                    onRenderRightContent={setRightContent}
                  />
                )}
              </div>
            );
        }

      case 'workorders':
        // 根据子菜单类型渲染不同内容
        const getWorkorderContent = () => {
          switch (activeSubTab) {
            case 'implementation':
              return {
                icon: '🔧',
                title: '实施工单内容开发中...',
                description: '这里将显示项目实施工单、进度跟踪、任务分配等'
              };
            case 'interface':
              return {
                icon: '🔌',
                title: '接口工单内容开发中...',
                description: '这里将显示接口对接工单、API调用记录、错误日志等'
              };
            default:
              return {
                icon: '📋',
                title: '工单管理开发中...',
                description: '这里将显示工单管理相关功能'
              };
          }
        };

        const content = getWorkorderContent();
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-4">{content.icon}</div>
                <p>{content.title}</p>
                <p className="text-sm mt-2">{content.description}</p>
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
    <>
      <TabsFramework
        menuItems={CUSTOMER_MENU_ITEMS}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onTabChange={handleTabChange}
        onSubTabChange={handleSubTabChange}
        onBackClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            navigate('/');
          }
        }}
        headerContent={
          <CurrentCustomerBar 
            customerName={currentCustomerName}
            onSelectCustomer={handleSelectCustomer}
            pageTitle={getPageTitle(activeTab, activeSubTab)}
            rightContent={rightContent}
          />
        }
      >
        {renderContent}
      </TabsFramework>

      {/* 客户字典选择器 */}
      <DictionarySelector
        dictionaries={dictionaries}
        isOpen={isCustomerSelectorOpen}
        onSelect={handleCustomerDictionarySelect}
        onClose={() => setIsCustomerSelectorOpen(false)}
        title="选择客户"
      />
    </>
  );
};

export default CustomerInfoPage;
