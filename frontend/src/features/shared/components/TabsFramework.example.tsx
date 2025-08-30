/**
 * TabsFramework 使用示例
 * 
 * 展示如何使用通用Tabs框架创建不同的功能页面
 */

import React, { useState } from 'react';
import { TabsFramework, MenuItem } from './TabsFramework';
import { useNavigate } from 'react-router-dom';

// 示例1：信息流页面（无二级菜单）
export const InfoFeedExample: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const menuItems: MenuItem[] = [
    { key: 'all', label: '所有', icon: <span>📰</span> },
    { key: 'related', label: '与我有关', icon: <span>👤</span> },
    { key: 'news', label: '新闻', icon: <span>📡</span> },
    { key: 'features', label: '新功能', icon: <span>🎉</span> },
    { key: 'knowledge', label: '新知识', icon: <span>💡</span> }
  ];

  return (
    <TabsFramework
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBackClick={() => navigate('/')}
    >
      {(activeTab) => (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">信息流 - {activeTab}</h2>
          <p>这里显示 {activeTab} 分类的信息流内容...</p>
        </div>
      )}
    </TabsFramework>
  );
};

// 示例2：客户信息页面（有二级菜单）
export const CustomerInfoExample: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [activeSubTab, setActiveSubTab] = useState('profile');

  const menuItems: MenuItem[] = [
    {
      key: 'basic',
      label: '基础信息',
      icon: <span>👤</span>,
      subItems: [
        { key: 'profile', label: '客户档案', icon: <span>📋</span> },
        { key: 'contacts', label: '联系方式', icon: <span>📞</span> },
        { key: 'address', label: '地址信息', icon: <span>📍</span> }
      ]
    },
    {
      key: 'business',
      label: '业务信息',
      icon: <span>💼</span>,
      subItems: [
        { key: 'orders', label: '订单记录', icon: <span>📦</span> },
        { key: 'contracts', label: '合同管理', icon: <span>📄</span> },
        { key: 'payments', label: '付款记录', icon: <span>💳</span> }
      ]
    },
    {
      key: 'analytics',
      label: '数据分析',
      icon: <span>📊</span>,
      subItems: [
        { key: 'sales', label: '销售分析', icon: <span>📈</span> },
        { key: 'behavior', label: '行为分析', icon: <span>🔍</span> },
        { key: 'trends', label: '趋势预测', icon: <span>📉</span> }
      ]
    }
  ];

  return (
    <TabsFramework
      menuItems={menuItems}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        // 切换主菜单时，设置默认的子菜单
        const newMenuItem = menuItems.find(item => item.key === tab);
        if (newMenuItem?.subItems && newMenuItem.subItems.length > 0) {
          setActiveSubTab(newMenuItem.subItems[0].key);
        }
      }}
      onSubTabChange={setActiveSubTab}
      onBackClick={() => navigate('/')}
    >
      {(activeTab, activeSubTab) => (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">客户信息管理</h2>
          <p className="text-gray-600 mb-4">
            当前选中: {activeTab} {activeSubTab && `> ${activeSubTab}`}
          </p>
          
          {/* 根据选中的菜单渲染不同内容 */}
          {activeTab === 'basic' && activeSubTab === 'profile' && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">客户档案</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">客户姓名</label>
                  <input className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">客户类型</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option>个人客户</option>
                    <option>企业客户</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'basic' && activeSubTab === 'contacts' && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">联系方式</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">手机号码</label>
                  <input className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱地址</label>
                  <input className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'business' && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">业务信息 - {activeSubTab}</h3>
              <p className="text-gray-600">这里显示 {activeSubTab} 的具体内容...</p>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">数据分析 - {activeSubTab}</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">图表区域: {activeSubTab}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </TabsFramework>
  );
};

// 示例3：简单的设置页面
export const SettingsExample: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const menuItems: MenuItem[] = [
    { key: 'general', label: '通用设置', icon: <span>⚙️</span> },
    { key: 'security', label: '安全设置', icon: <span>🔒</span> },
    { key: 'notifications', label: '通知设置', icon: <span>🔔</span> },
    { key: 'advanced', label: '高级设置', icon: <span>🛠️</span> }
  ];

  return (
    <TabsFramework
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBackClick={() => navigate('/')}
    >
      {(activeTab) => (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">系统设置</h2>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">{activeTab}</h3>
            <p>这里显示 {activeTab} 设置选项...</p>
          </div>
        </div>
      )}
    </TabsFramework>
  );
};