import React, { useState, useEffect } from 'react';
import { Avatar, Dropdown } from 'antd';
import { Button as AntdButton } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SmileOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { getIsAdmin } from '../../admin/services/adminApi';
import { Conversations } from '@ant-design/x';
import logoTree from '../../../assets/logoTree.png';
import { clearAuth, getUsername } from '../../auth/utils/auth';
import { DeleteConversationDialog } from './DeleteConversationDialog';
import { RenameConversationDialog } from './RenameConversationDialog';
import { conversationApi } from '../services/chatService';
import type { ConversationItem } from '../hooks/useChatState';

interface ChatSidebarProps {
  conversations: ConversationItem[];
  currentConversation: string;
  loading: boolean;
  onNewConversation: () => void;
  onConversationChange: (conversationKey: string) => void;
  onDeleteConversation: (conversationKey: string) => void;
  onRefreshConversations: () => void; // 新增：刷新会话列表的回调
}

/**
 * 聊天侧边栏组件
 * 包含Logo、新建会话按钮、会话列表和用户信息
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  currentConversation,
  loading,
  onNewConversation,
  onConversationChange,
  onDeleteConversation,
  onRefreshConversations,
}) => {
  // 删除对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    key: string;
    title: string;
  } | null>(null);
  
  // 重命名对话框状态
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<{
    key: string;
    title: string;
  } | null>(null);
  
  // 侧边栏状态管理
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 响应式检测（三态：展开 / 折叠 / 悬浮）
  useEffect(() => {
    const MOBILE_BREAKPOINT = 768;     // <768: 悬浮
    const EXPANDED_BREAKPOINT = 1024;  // >=1024: 展开；[768,1024): 折叠

    const applyLayoutByWidth = (width: number) => {
      if (width < MOBILE_BREAKPOINT) {
        // 悬浮
        setIsMobile(true);
        setIsMobileMenuOpen(false); // 默认关闭悬浮菜单
        setIsSidebarCollapsed(true); // 折叠逻辑对移动端内容渲染不影响
      } else if (width < EXPANDED_BREAKPOINT) {
        // 折叠
        setIsMobile(false);
        setIsMobileMenuOpen(false);
        setIsSidebarCollapsed(true);
      } else {
        // 展开
        setIsMobile(false);
        setIsMobileMenuOpen(false);
        setIsSidebarCollapsed(false);
      }
    };

    const handleResize = () => applyLayoutByWidth(window.innerWidth);

    // 初始化与监听
    applyLayoutByWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 检查是否为管理员，用于显示“后台管理”入口
  useEffect(() => {
    let mounted = true;
    getIsAdmin()
      .then((ok) => { if (mounted) setIsAdmin(!!ok); })
      .catch(() => { if (mounted) setIsAdmin(false); });
    return () => { mounted = false; };
  }, []);

  // 切换侧边栏状态
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };
  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const handleNewConversation = () => {
    if (loading) {
      alert('消息发送中，请等待请求完成后再创建新会话');
      return;
    }
    onNewConversation();
  };

  const handleDeleteConversation = (conversationKey: string) => {
    // 不能删除虚拟会话
    if (conversationKey === 'default-0' || conversationKey === 'new') {
      return;
    }

    const conversation = conversations.find(c => c.key === conversationKey);
    const conversationTitle = conversation?.label || '此会话';

    // 设置要删除的会话信息并打开对话框
    setConversationToDelete({
      key: conversationKey,
      title: conversationTitle,
    });
    setDeleteDialogOpen(true);
  };

  // 确认删除会话
  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete.key);
      setConversationToDelete(null);
    }
  };

  // 处理重命名会话
  const handleRenameConversation = (conversationKey: string) => {
    // 不能重命名虚拟会话
    if (conversationKey === 'default-0' || conversationKey === 'new') {
      return;
    }

    const conversation = conversations.find(c => c.key === conversationKey);
    const conversationTitle = conversation?.label || '此会话';
    
    // 设置要重命名的会话信息并打开对话框
    setConversationToRename({
      key: conversationKey,
      title: conversationTitle,
    });
    setRenameDialogOpen(true);
  };

  // 确认重命名会话
  const handleConfirmRename = async (newTitle: string) => {
    if (!conversationToRename) return;
    
    try {
      // 调用重命名API
      await conversationApi.renameConversation(conversationToRename.key, newTitle);
      
      // 刷新会话列表
      onRefreshConversations();
      
      // 清理状态
      setConversationToRename(null);
    } catch (error) {
      console.error('重命名会话失败:', error);
      throw error; // 让对话框组件处理错误状态
    }
  };

  return (
    <>
      {/* 移动端蒙版 */}
      {isMobile && isMobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* 侧边栏主体 */}
      <div 
        style={{ 
          // 移动端：打开时固定 280px，关闭时为 0；
          // 桌面端：根据折叠状态在 64/280 之间切换
          width: isMobile 
            ? (isMobileMenuOpen ? 280 : 0) 
            : (isSidebarCollapsed ? 64 : 280),
          height: '100%', 
          borderRight: isMobile && !isMobileMenuOpen ? 'none' : '1px solid #f0f0f0', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#fff',
          transition: 'width 0.2s ease, left 0.2s ease',
          overflow: 'hidden',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isMobileMenuOpen ? 0 : '-280px') : 'auto',
          zIndex: isMobile ? 1001 : 'auto',
          boxSizing: 'border-box',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        }}>
        
        {/* 顶部工具栏 - 在折叠状态下显示汉堡菜单 */}
        {isSidebarCollapsed && !isMobile && (
          <div style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <button
              onClick={toggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="展开侧边栏"
            >
              <MenuOutlined />
            </button>
          </div>
        )}
        {/* Logo区域：移动端打开菜单时也显示 */}
        {(!isSidebarCollapsed || (isMobile && isMobileMenuOpen)) && (
          <div style={{ 
            padding: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            borderBottom: '1px solid #f0f0f0',
            position: 'relative'
          }}>
            {/* 折叠按钮 - 仅在桌面端显示 */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#666'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="折叠侧边栏"
              >
                <MenuOutlined style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <img
              src={logoTree}
              draggable={false}
              alt="logo"
              width={24}
              height={24}
            />
            <span>朗珈GPT</span>
          </div>
        )}
        
        {/* 折叠状态下的Logo */}
        {isSidebarCollapsed && !isMobile && (
          <div style={{ 
            padding: '16px', 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <img
              src={logoTree}
              draggable={false}
              alt="logo"
              width={24}
              height={24}
            />
          </div>
        )}

        {/* 新建会话按钮：移动端打开菜单时也显示 */}
        {!isSidebarCollapsed || (isMobile && isMobileMenuOpen) ? (
          <AntdButton
            onClick={handleNewConversation}
            type="link"
            style={{ margin: '8px 16px', textAlign: 'left' }}
            icon={<PlusOutlined />}
          >
            新建会话
          </AntdButton>
        ) : !isMobile && (
          <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleNewConversation}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="新建会话"
            >
              <PlusOutlined />
            </button>
          </div>
        )}

        {/* 会话列表：移动端打开菜单时也显示 */}
        {(!isSidebarCollapsed || (isMobile && isMobileMenuOpen)) && (
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' as any }}>
            <Conversations
          items={conversations}
          activeKey={currentConversation}
          onActiveChange={(val) => {
            onConversationChange(val as string);
            if (isMobile) {
              setIsMobileMenuOpen(false);
            }
          }}
          groupable
          styles={{ item: { padding: '0 8px' } }}
          menu={(conversation) => {
            // 只对真实会话显示删除菜单
            const isRealConversation = conversation.key && 
                                      conversation.key !== 'new' && 
                                      !conversation.key.startsWith('default-') &&
                                      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(conversation.key);
            
            const menuItems = [
              {
                label: '重命名',
                key: 'rename',
                icon: <EditOutlined />,
              }
            ];

            if (isRealConversation) {
              menuItems.push({
                label: '删除',
                key: 'delete',
                icon: <DeleteOutlined />,
                danger: true,
              } as any); // 临时类型断言，因为Antd的类型定义问题
            }

            return { 
              items: menuItems,
              onClick: ({ key }: { key: string }) => {
                if (key === 'delete') {
                  handleDeleteConversation(conversation.key);
                } else if (key === 'rename') {
                  handleRenameConversation(conversation.key);
                }
              }
            };
          }}
            />
          </div>
        )}

        {/* 用户信息区域：移动端打开菜单时也显示 */}
        {!isSidebarCollapsed || (isMobile && isMobileMenuOpen) ? (
          <div style={{ 
            padding: '12px 12px', 
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}>
        <Dropdown
          placement="topLeft"
          menu={{
            items: [
              { key: 'profile', label: '个人资料' },
              ...(isAdmin ? [{ key: 'admin', label: (<a href="/admin" target="_blank" rel="noopener noreferrer">后台管理</a>) }] : []),
              { type: 'divider' as const },
              { 
                key: 'logout', 
                danger: true, 
                label: '退出登录',
                onClick: handleLogout,
              },
              { type: 'divider' as const },
              { key: 'version', label: `版本 v${String(import.meta.env.VITE_APP_VERSION || '')}`, disabled: true },
            ],
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget.style.backgroundColor = '#f5f5f5');
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.backgroundColor = 'transparent');
            }}
          >
            <Avatar size={28} icon={<SmileOutlined />} />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              lineHeight: 1 
            }}>
              <span style={{ fontWeight: 500 }}>
                {getUsername() || '用户'}
              </span>
              <span style={{ fontSize: 12, color: '#999' }}>
                账户
              </span>
            </div>
          </div>
            </Dropdown>
          </div>
        ) : !isMobile && (
          <div style={{ 
            padding: '12px', 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Dropdown
              placement="topRight"
              menu={{
                items: [
                  { key: 'profile', label: '个人资料' },
                  ...(isAdmin ? [{ key: 'admin', label: (<a href="/admin" target="_blank" rel="noopener noreferrer">后台管理</a>) }] : []),
                  { type: 'divider' as const },
                  { 
                    key: 'logout', 
                    danger: true, 
                    label: '退出登录',
                    onClick: handleLogout,
                  },
                  { type: 'divider' as const },
                  { key: 'version', label: `版本 v${String(import.meta.env.VITE_APP_VERSION || '')}`, disabled: true },
                ],
              }}
            >
              <Avatar 
                size={28} 
                icon={<SmileOutlined />} 
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        )}

      {/* 删除确认对话框 */}
      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        conversationTitle={conversationToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
      />

        {/* 重命名对话框 */}
        <RenameConversationDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          conversationTitle={conversationToRename?.title || ''}
          onConfirm={handleConfirmRename}
        />
      </div>
      
      {/* 移动端时的切换按钮 */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1002,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MenuOutlined />
        </button>
      )}
    </>
  );
};
