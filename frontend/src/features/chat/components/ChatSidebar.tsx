import React from 'react';
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
import type { ConversationItem } from '../hooks/useChatState';

interface ChatSidebarProps {
  conversations: ConversationItem[];
  currentConversation: string;
  loading: boolean;
  onNewConversation: () => void;
  onConversationChange: (conversationKey: string) => void;
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
}) => {
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
          menu={(conversation) => ({
            items: [
              {
                label: '重命名',
                key: 'rename',
                icon: <EditOutlined />,
              },
              {
                label: '删除',
                key: 'delete',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                  // TODO: 实现删除功能
                  console.log('删除会话:', conversation.key);
                },
              },
            ],
          })}
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
    </div>
  );
};