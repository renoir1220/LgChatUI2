import React, { useState } from 'react';
import { Avatar, Dropdown } from 'antd';
import { Button as AntdButton } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import logoTree from '../../../assets/logoTree.png';
import { clearAuth, getUsername } from '../../auth/utils/auth';
import { DeleteConversationDialog } from './DeleteConversationDialog';
import type { ConversationItem } from '../hooks/useChatState';

interface ChatSidebarProps {
  conversations: ConversationItem[];
  currentConversation: string;
  loading: boolean;
  onNewConversation: () => void;
  onConversationChange: (conversationKey: string) => void;
  onDeleteConversation: (conversationKey: string) => void;
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
}) => {
  // 删除对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    key: string;
    title: string;
  } | null>(null);
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
    console.log('=== handleDeleteConversation 被调用 ===');
    console.log('传入的conversationKey:', conversationKey);
    
    // 不能删除虚拟会话
    if (conversationKey === 'default-0' || conversationKey === 'new') {
      console.log('这是虚拟会话，不能删除');
      return;
    }

    const conversation = conversations.find(c => c.key === conversationKey);
    const conversationTitle = conversation?.label || '此会话';
    
    console.log('找到会话:', conversation);
    console.log('会话标题:', conversationTitle);

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
      console.log('用户确认删除，调用onDeleteConversation');
      onDeleteConversation(conversationToDelete.key);
      setConversationToDelete(null);
    }
  };

  return (
    <div style={{ 
      width: 280, 
      height: '100vh', 
      borderRight: '1px solid #f0f0f0', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Logo区域 */}
      <div style={{ 
        padding: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        borderBottom: '1px solid #f0f0f0' 
      }}>
        <img
          src={logoTree}
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>朗珈GPT</span>
      </div>

      {/* 新建会话按钮 */}
      <AntdButton
        onClick={handleNewConversation}
        type="link"
        style={{ margin: '8px 16px', textAlign: 'left' }}
        icon={<PlusOutlined />}
      >
        新建会话
      </AntdButton>

      {/* 会话列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Conversations
          items={conversations}
          activeKey={currentConversation}
          onActiveChange={(val) => {
            setTimeout(() => {
              onConversationChange(val as string);
            }, 100);
          }}
          groupable
          styles={{ item: { padding: '0 8px' } }}
          menu={(conversation) => {
            // 只对真实会话显示删除菜单
            const isRealConversation = conversation.key && 
                                      conversation.key !== 'new' && 
                                      !conversation.key.startsWith('default-') &&
                                      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(conversation.key);
            
            console.log('=== 菜单调试信息 ===');
            console.log('会话key:', conversation.key);
            console.log('是否为真实会话:', isRealConversation);
            
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
                console.log('=== 菜单点击调试 ===');
                console.log('点击的菜单项key:', key);
                console.log('会话key:', conversation.key);
                
                if (key === 'delete') {
                  console.log('调用删除函数...');
                  handleDeleteConversation(conversation.key);
                } else if (key === 'rename') {
                  // TODO: 实现重命名功能
                  console.log('重命名会话:', conversation.key);
                }
              }
            };
          }}
        />
      </div>

      {/* 用户信息区域 */}
      <div style={{ 
        padding: '12px 12px', 
        borderTop: '1px solid #f0f0f0' 
      }}>
        <Dropdown
          placement="topLeft"
          menu={{
            items: [
              { key: 'profile', label: '个人资料' },
              { type: 'divider' as const },
              { 
                key: 'logout', 
                danger: true, 
                label: '退出登录',
                onClick: handleLogout,
              },
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

      {/* 删除确认对话框 */}
      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        conversationTitle={conversationToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};