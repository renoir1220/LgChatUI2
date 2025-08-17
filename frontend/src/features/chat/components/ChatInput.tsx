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
  DatabaseOutlined
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
      {/* 知识库选择器 */}
      <div style={{ marginBottom: 8 }}>
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
            <AntdButton size="small" style={{ borderRadius: 16 }}>
              <DatabaseOutlined style={{ marginRight: 6 }} />
              {knowledgeBases.find((k) => k.id === currentKnowledgeBase)?.name || '选择知识库'}
              <DownOutlined style={{ marginLeft: 6, fontSize: 10 }} />
            </AntdButton>
          </Dropdown>
        )}
      </div>

      {/* 消息输入框 */}
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={handleSubmit}
        onChange={onInputChange}
        onCancel={onCancel}
        prefix={
          <AntdButton
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={onAttachmentsToggle}
          />
        }
        loading={loading}
        placeholder="输入消息或使用技能"
        actions={(_, info) => {
          const { SendButton, LoadingButton } = info.components;
          return (
            <Flex gap={4}>
              {loading ? (
                <LoadingButton type="default" />
              ) : (
                <SendButton type="primary" />
              )}
            </Flex>
          );
        }}
      />
    </div>
  );
};