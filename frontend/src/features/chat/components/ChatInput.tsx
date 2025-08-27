import React, { useEffect, useRef } from 'react';
import { Sender, Attachments } from '@ant-design/x';
import { Dropdown, Skeleton, Flex } from 'antd';
import { Button as AntdButton } from 'antd';
import type { UploadFile } from 'antd';
import { 
  CloudUploadOutlined,
  DownOutlined,
  CheckOutlined,
  DatabaseOutlined,
  PlusOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  SearchOutlined,
  BulbOutlined,
  CameraOutlined,
  BugOutlined
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
  onQuickAction?: (action: string) => void;
  onCameraCapture?: (imageDataUrl: string) => void;
  // 在欢迎页模式下使用玻璃质感，增强渐入过渡
  glass?: boolean;
  // 跳转焦点到输入框末尾的信号（每次变更时触发）
  focusAtEndSignal?: number;
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
  onQuickAction,
  onCameraCapture,
  glass = false,
  focusAtEndSignal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<string>(inputValue);
  valueRef.current = inputValue;

  // 设备类型检测：区分移动端/桌面端
  const isMobile = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
    const mobileUA = /android|iphone|ipad|ipod|mobile/i.test(ua);
    return !!(coarse || mobileUA);
  }, []);
  
  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue);
      onInputChange('');
    }
  };

  // 处理相机拍照
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择（拍照或从相册选择）
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        if (onCameraCapture) {
          onCameraCapture(imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  // 当收到外部聚焦信号时，将光标移动到输入框末尾
  useEffect(() => {
    if (focusAtEndSignal === undefined) return;
    const root = containerRef.current;
    if (!root) return;
    // 兼容 textarea 或 contenteditable 元素
    const el = (root.querySelector('textarea') || root.querySelector('[contenteditable="true"]')) as HTMLElement | null;
    if (!el) return;
    // 聚焦元素
    (el as any).focus?.();
    // 移动到末尾
    if (el instanceof HTMLTextAreaElement) {
      const len = el.value?.length ?? 0;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    } else {
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {}
    }
  }, [focusAtEndSignal]);

  // 移动端：拦截回车，插入换行，不触发提交
  useEffect(() => {
    if (!isMobile) return;
    const root = containerRef.current;
    if (!root) return;
    const textarea = root.querySelector('textarea');
    if (!textarea) return;

    const onKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' && !ke.isComposing) {
        // Enter 在移动端为换行；Shift+Enter 也当换行
        ke.preventDefault();
        const el = ke.target as HTMLTextAreaElement;
        const start = el.selectionStart ?? valueRef.current.length;
        const end = el.selectionEnd ?? start;
        const before = valueRef.current.slice(0, start);
        const after = valueRef.current.slice(end);
        const next = `${before}\n${after}`;
        onInputChange(next);
        // 恢复光标位置到换行后
        requestAnimationFrame(() => {
          try {
            el.setSelectionRange(start + 1, start + 1);
          } catch {}
        });
      }
    };

    textarea.addEventListener('keydown', onKeyDown as any, { passive: false });
    return () => textarea.removeEventListener('keydown', onKeyDown as any);
  }, [isMobile, onInputChange]);

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
    <div ref={containerRef} style={{ 
      paddingInline: 'max(16px, calc((100% - 800px) / 2))', 
      paddingTop: 8, 
      paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
    }}>
      {/* 现代Chat UI布局 */}
      <div style={{
        borderRadius: 24,
        border: glass ? '1px solid rgba(255,255,255,0.5)' : '1px solid #e1e5e9',
        backgroundColor: '#ffffff',
        backdropFilter: glass ? 'blur(8px)' as any : undefined,
        WebkitBackdropFilter: glass ? 'blur(8px)' as any : undefined,
        padding: '8px 12px 6px 12px',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 2px 12px rgba(0, 0, 0, 0.08)',
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
          // 桌面：Enter 发送，Shift+Enter 换行；移动端：通过 keydown 拦截实现回车换行
          submitType="enter"
          style={{ 
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent'
          }}
          styles={{
            input: { 
              border: 'none',
              backgroundColor: 'transparent',
              minHeight: 20,
              padding: 0,
              fontSize: 16,
              lineHeight: 1.4,
              resize: 'none',
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
          borderTop: glass ? '1px solid rgba(255,255,255,0.6)' : '1px solid #f0f0f0'
        }}>
          {/* 左侧功能按钮 */}
          <Flex gap={4} align="center">
            {/* 隐藏的文件输入元素 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            {/* 功能菜单按钮 */}
            <Dropdown
              trigger={['click']}
              placement="topLeft"
              menu={{
                items: [
                  // 暂时隐藏上传文件功能
                  // {
                  //   key: 'upload-file',
                  //   label: (
                  //     <div style={{ 
                  //       display: 'flex', 
                  //       alignItems: 'center', 
                  //       gap: 8,
                  //       padding: '4px 0'
                  //     }}>
                  //       <PaperClipOutlined style={{ fontSize: 16, color: '#666' }} />
                  //       <span>上传文件</span>
                  //     </div>
                  //   ),
                  // },
                  // {
                  //   type: 'divider',
                  // },
                  {
                    key: 'readme-query',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <FileSearchOutlined style={{ fontSize: 16, color: '#666' }} />
                        <span>Readme查询</span>
                      </div>
                    ),
                  },
                  {
                    key: 'requirement-progress',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <ProjectOutlined style={{ fontSize: 16, color: '#666' }} />
                        <span>需求进展</span>
                      </div>
                    ),
                  },
                  {
                    key: 'similar-requirements',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <SearchOutlined style={{ fontSize: 16, color: '#666' }} />
                        <span>相似需求</span>
                      </div>
                    ),
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'suggestion',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <BulbOutlined style={{ fontSize: 16, color: '#f5a623' }} />
                        <span style={{ color: '#f5a623', fontWeight: 500 }}>提建议</span>
                      </div>
                    ),
                  },
                  {
                    key: 'bug-report',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '4px 0'
                      }}>
                        <BugOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />
                        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>提BUG</span>
                      </div>
                    ),
                  },
                ],
                onClick: ({ key }) => {
                  // 暂时隐藏上传文件功能
                  // if (key === 'upload-file') {
                  //   onAttachmentsToggle();
                  // } else 
                  if (onQuickAction) {
                    onQuickAction(key);
                  }
                },
              }}
            >
              <AntdButton
                type="text"
                icon={<PlusOutlined style={{ fontSize: 16 }} />}
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
                title="功能菜单"
              />
            </Dropdown>

            {/* 照相机按钮 */}
            <AntdButton
              type="text"
              icon={<CameraOutlined style={{ fontSize: 16 }} />}
              onClick={handleCameraClick}
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
              title="拍照"
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
          <span style={{ fontSize: 11, color: '#999', marginRight: 4 }}>
            {isMobile ? '回车换行 · 点发送按钮发送' : 'Enter 发送 · Shift+Enter 换行'}
          </span>
        </div>
      </div>
    </div>
  );
};
