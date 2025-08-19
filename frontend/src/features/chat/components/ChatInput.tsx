import React from 'react';
import { Sender, Attachments } from '@ant-design/x';
import { Dropdown, Skeleton, Flex } from 'antd';
import { Button as AntdButton } from 'antd';
import type { UploadFile } from 'antd';
import { 
  CloudUploadOutlined,
  PaperClipOutlined,
  DownOutlined,
  CheckOutlined,
  DatabaseOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { KnowledgeBase } from '../../knowledge-base/hooks/useKnowledgeBases';

interface ChatInputProps {
  inputValue: string;
  loading: boolean;
  attachmentsOpen: boolean;
  attachedFiles: UploadFile[];
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: string | undefined;
  kbLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onCancel: () => void;
  onAttachmentsToggle: () => void;
  onFilesChange: (files: UploadFile[]) => void;
  onKnowledgeBaseChange: (kbId: string) => void;
}

/**
 * 聊天输入区域组件
 * 包含知识库选择器、消息输入框和附件上传
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  loading,
  attachmentsOpen,
  attachedFiles,
  knowledgeBases,
  currentKnowledgeBase,
  kbLoading,
  onInputChange,
  onSubmit,
  onCancel,
  onAttachmentsToggle,
  onFilesChange,
  onKnowledgeBaseChange,
}) => {
  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue);
      onInputChange('');
    }
  };

  const senderHeader = (
    <Sender.Header
      title="上传文件"
      open={attachmentsOpen}
      onOpenChange={onAttachmentsToggle}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => onFilesChange(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: '拖拽文件到此处' }
            : {
                icon: <CloudUploadOutlined />,
                title: '上传文件',
                description: '点击或拖拽文件到此处上传',
              }
        }
      />
    </Sender.Header>
  );

  return (
    <div style={{ 
      paddingInline: 'max(16px, calc((100% - 800px) / 2))', 
      paddingTop: 8, 
      paddingBottom: 16 
    }}>
      {/* 现代Chat UI布局 */}
      <div style={{
        borderRadius: 24,
        border: '1px solid #e1e5e9',
        backgroundColor: '#ffffff',
        padding: '8px 12px 6px 12px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}>
        {/* 主输入区域 */}
        <Sender
          value={inputValue}
          header={senderHeader}
          onSubmit={handleSubmit}
          onChange={onInputChange}
          onCancel={onCancel}
          loading={loading}
          placeholder="询问任何问题"
          style={{ 
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent'
          }}
          styles={{
            content: { 
              border: 'none',
              backgroundColor: 'transparent',
              minHeight: 20,
              padding: 0
            },
            textarea: { 
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 16,
              lineHeight: 1.4,
              resize: 'none',
              padding: 0,
              fontFamily: 'inherit'
            }
          }}
          actions={(_, info) => {
            const { SendButton, LoadingButton } = info.components;
            return (
              <Flex gap={4} style={{ marginLeft: 8 }}>
                {loading ? (
                  <LoadingButton 
                    type="text" 
                    style={{ 
                      borderRadius: 16,
                      width: 28,
                      height: 28,
                      padding: 0,
                      minWidth: 28
                    }} 
                  />
                ) : (
                  <SendButton 
                    type="primary" 
                    style={{ 
                      borderRadius: 16,
                      width: 28,
                      height: 28,
                      padding: 0,
                      backgroundColor: inputValue.trim() ? '#1677ff' : '#ccc',
                      borderColor: inputValue.trim() ? '#1677ff' : '#ccc',
                      minWidth: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    disabled={!inputValue.trim()}
                  />
                )}
              </Flex>
            );
          }}
        />
        
        {/* 功能按钮区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid #f0f0f0'
        }}>
          {/* 左侧功能按钮 */}
          <Flex gap={4} align="center">
            {/* 添加附件按钮 */}
            <AntdButton
              type="text"
              icon={<PlusOutlined style={{ fontSize: 16 }} />}
              onClick={onAttachmentsToggle}
              style={{
                borderRadius: 16,
                width: 28,
                height: 28,
                padding: 0,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="上传文件"
            />
            
            {/* 知识库选择器 */}
            {kbLoading ? (
              <Skeleton.Button active size="small" />
            ) : (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: (knowledgeBases || []).map((kb) => ({
                    key: kb.id,
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8 
                      }}>
                        {currentKnowledgeBase === kb.id ? (
                          <CheckOutlined style={{ color: '#1677ff' }} />
                        ) : (
                          <span style={{ width: 14 }} />
                        )}
                        <span>{kb.name}</span>
                      </div>
                    ),
                  })),
                  onClick: ({ key }) => onKnowledgeBaseChange(key as string),
                }}
              >
                <AntdButton 
                  size="small" 
                  type="text"
                  style={{ 
                    borderRadius: 14,
                    color: '#666',
                    fontSize: 12,
                    height: 24,
                    padding: '0 8px',
                    marginLeft: 8,
                    border: '1px solid #e1e5e9'
                  }}
                >
                  <DatabaseOutlined style={{ marginRight: 4, fontSize: 12 }} />
                  {knowledgeBases.find((k) => k.id === currentKnowledgeBase)?.name || '知识库'}
                  <DownOutlined style={{ marginLeft: 4, fontSize: 10 }} />
                </AntdButton>
              </Dropdown>
            )}
          </Flex>
          
          {/* 右侧提示文字 */}
          <span style={{
            fontSize: 11,
            color: '#999',
            marginRight: 4
          }}>
            按 Enter 发送
          </span>
        </div>
      </div>
    </div>
  );
};