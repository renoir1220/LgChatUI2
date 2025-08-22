import React from 'react';
import { Bubble } from '@ant-design/x';
import { Space, Spin, message, Divider } from 'antd';
import { Button as AntdButton } from 'antd';
import { Button } from '../../../components/ui/button';
import { Copy, RotateCcw } from 'lucide-react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown.css';
import './ChatMessage.css';
import { CitationList } from '../../knowledge-base/components/CitationList';
import { VoicePlayer } from './VoicePlayer';
import { RequirementMessage } from './RequirementMessage';
import { detectMessageType, MessageType } from '../../shared/utils/messageTypeDetector';
import { getUsername } from '../../auth/utils/auth';
import { FileSearchOutlined, ProjectOutlined, SearchOutlined, BulbOutlined } from '@ant-design/icons';
import type { BubbleDataType } from '../hooks/useChatState';

// 初始化 markdown-it 渲染器
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Markdown 渲染函数
const renderMarkdown = (content: string, isUser = false) => {
  const renderedHTML = md.render(content || '');
  const sanitizedHTML = DOMPurify.sanitize(renderedHTML);
  
  return (
    <div 
      className={`markdown-body chat-markdown-body ${isUser ? 'user-message' : ''}`}
      style={{ backgroundColor: 'transparent' }}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

// 采用登录页一致的渐变风格欢迎界面

interface ChatMessageListProps {
  messages: BubbleDataType[];
  loading: boolean;
  currentKnowledgeBase: string | undefined;
  onSubmit: (message: string) => void;
  onRegenerate: (messageIndex: number) => void;
  // 新增：控制是否展示欢迎界面；当为真实会话但消息尚未加载时禁用欢迎界面
  showWelcome?: boolean;
  // 新增：消息加载中（首次打开某会话时）
  messagesLoading?: boolean;
  // 新增：欢迎页快捷操作（与输入区加号菜单一致）
  onQuickAction?: (action: string) => void;
}

/**
 * 聊天消息列表组件
 * 显示消息历史和欢迎界面
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  loading,
  currentKnowledgeBase,
  onSubmit,
  onRegenerate,
  showWelcome = true,
  messagesLoading = false,
  onQuickAction,
}) => {
  // 复制消息到剪贴板
  const handleCopyMessage = async (content: string) => {
    try {
      // 检测消息类型，如果是需求消息，复制格式化文本
      const messageData = detectMessageType(content);
      let textToCopy = content;
      
      if (messageData.type === MessageType.REQUIREMENTS && messageData.data?.requirements) {
        const { requirements, total } = messageData.data.requirements;
        const customerName = requirements.length > 0 ? requirements[0].customerName : '未知客户';
        
        textToCopy = `需求清单 - ${customerName} (共${total}条)\n\n` +
          requirements.map((req, index) => 
            `${index + 1}. ${req.requirementCode} - ${req.requirementName}\n` +
            `   状态：${req.currentStage} | 产品：${req.product}\n` +
            `   创建人：${req.creator} | 更新时间：${req.lastUpdateDate}\n`
          ).join('\n');
      }
      
      await navigator.clipboard.writeText(textToCopy);
      message.success('消息已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 处理重新生成
  const handleRegenerate = (messageIndex: number) => {
    if (loading) {
      message.warning('请等待当前请求完成后再重新生成');
      return;
    }
    onRegenerate(messageIndex);
  };

  // 如果没有消息，根据上下文显示欢迎界面或加载中
  if (!messages || messages.length === 0) {
    if (!showWelcome) {
      return (
        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {messagesLoading ? (
            <Space direction="vertical" align="center">
              <Spin size="large" />
              <div style={{ color: 'rgba(0,0,0,0.45)' }}>加载会话中...</div>
            </Space>
          ) : null}
        </div>
      );
    }
    const username = getUsername();
    // 根据北京时间生成问候语
    const getBeijingGreeting = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const beijing = new Date(utc + 8 * 3600000);
      const h = beijing.getHours();
      if (h >= 5 && h < 11) return '早晨好';
      if (h >= 11 && h < 13) return '中午好';
      if (h >= 13 && h < 18) return '下午好';
      if (h >= 18 && h < 23) return '晚上好';
      return '凌晨好';
    };
    const greeting = getBeijingGreeting();
    return (
      <div className="relative flex-1 h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-100">
        {/* 装饰性渐变圆斑 */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-[38rem] rounded-full bg-gradient-to-tr from-indigo-300/40 to-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-[38rem] rounded-full bg-gradient-to-tr from-cyan-200/40 to-violet-200/30 blur-3xl" />

        {/* 欢迎文字与快捷操作：仅将欢迎词垂直居中，按钮独立放在其下方 */}
        <div className="relative z-10 h-full w-full p-6">
          {/* 欢迎词绝对垂直居中 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-center select-none text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #0EA5E9, #1E40AF)' }}>
                {greeting}
                {username ? `，${username}` : ''}
              </span>
            </h1>
          </div>
          {/* 按钮位于欢迎词下方，不影响其垂直居中 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3"
            style={{ top: 'calc(50% + 64px)' }}
          >
            <AntdButton
              size="large"
              type="text"
              icon={<FileSearchOutlined />}
              onClick={() => onQuickAction?.('readme-query')}
              style={{
                borderRadius: 12,
                border: '1px solid #1677ff',
                background: 'transparent',
                color: '#1677ff',
                padding: '8px 18px',
                height: 44,
              }}
            >
              Readme查询
            </AntdButton>
            <AntdButton
              size="large"
              type="text"
              icon={<ProjectOutlined />}
              onClick={() => onQuickAction?.('requirement-progress')}
              style={{
                borderRadius: 12,
                border: '1px solid #1677ff',
                background: 'transparent',
                color: '#1677ff',
                padding: '8px 18px',
                height: 44,
              }}
            >
              需求进展
            </AntdButton>
            <AntdButton
              size="large"
              type="text"
              icon={<SearchOutlined />}
              onClick={() => onQuickAction?.('similar-requirements')}
              style={{
                borderRadius: 12,
                border: '1px solid #1677ff',
                background: 'transparent',
                color: '#1677ff',
                padding: '8px 18px',
                height: 44,
              }}
            >
              相似需求
            </AntdButton>
            <AntdButton
              size="large"
              type="text"
              icon={<BulbOutlined />}
              onClick={() => onQuickAction?.('suggestion')}
              style={{
                borderRadius: 12,
                border: '2px solid #f5a623',
                background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 100%)',
                color: '#ffffff',
                padding: '8px 18px',
                height: 44,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 166, 35, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 166, 35, 0.3)';
              }}
            >
              提建议
            </AntdButton>
          </div>
        </div>
      </div>
    );
  }

  // 渲染消息列表
  return (
    <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
      <Bubble.List
        items={messages.map((msg, index) => {
          const isStreamingAssistant = loading && index === messages.length - 1 && msg.role === 'assistant';
          
          // 检测消息类型并处理消息内容
          let contentNode: React.ReactNode;
          
          if (!isStreamingAssistant && msg.role === 'assistant') {
            // 检测消息类型
            const messageData = detectMessageType(msg.content);
            
            if (messageData.type === MessageType.REQUIREMENTS && messageData.data?.requirements) {
              // 渲染需求消息
              contentNode = (
                <RequirementMessage 
                  data={messageData.data.requirements}
                  customerName={messageData.data.customerName}
                />
              );
            } else if (msg.citations && msg.citations.length > 0) {
              // 渲染带引用的普通消息
              contentNode = (
                <div>
                  {renderMarkdown(msg.content, false)}
                  <Divider style={{ margin: '8px 0' }} />
                  <CitationList citations={msg.citations} kbId={currentKnowledgeBase} />
                </div>
              );
            } else {
              // 渲染普通消息
              contentNode = msg.content;
            }
          } else {
            // 用户消息或流式消息
            if (msg.image) {
              // 用户消息包含图片
              contentNode = (
                <div>
                  <img 
                    src={msg.image} 
                    alt="用户上传的图片" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      borderRadius: '8px',
                      marginBottom: msg.content === '[拍照上传]' ? 0 : '8px'
                    }} 
                  />
                  {msg.content !== '[拍照上传]' && <div>{msg.content}</div>}
                </div>
              );
            } else {
              contentNode = msg.content;
            }
          }

          return {
            ...msg,
            content: contentNode as React.ReactNode,
            classNames: {
              content: isStreamingAssistant ? 'loading-message' : '',
            },
            typing: isStreamingAssistant ? { step: 5, interval: 20 } : false,
            footer: msg.role === 'assistant'
              ? (
                  <div className="message-container" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8 
                  }}>
                    <div className="message-actions" style={{ 
                      display: 'flex', 
                      gap: 4, 
                      alignItems: 'center' 
                    }}>
                      <VoicePlayer text={msg.content} />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="复制消息"
                        onClick={() => handleCopyMessage(msg.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="重新生成"
                        onClick={() => handleRegenerate(index)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              : undefined,
          };
        })}
        style={{ 
          height: '100%', 
          paddingInline: 'max(16px, calc((100% - 800px) / 2))',
          paddingTop: '16px',
          paddingBottom: '16px'
        }}
        roles={{
          assistant: {
            placement: 'start',
            // 不显示头像，减少两侧留白
            loadingRender: () => <Spin size="small" />,
            messageRender: (content: React.ReactNode) => {
              if (typeof content === 'string') {
                return renderMarkdown(content, false);
              }
              return content;
            },
            styles: {
              content: {
                background: '#ffffff',
                border: '1px solid #e1e4e8',
                borderRadius: 12,
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
              },
            },
          },
          user: {
            placement: 'end',
            // 不显示头像，减少两侧留白
            messageRender: (content: React.ReactNode) => {
              if (typeof content === 'string') {
                return renderMarkdown(content, true);
              }
              return content;
            },
            styles: {
              content: {
                background: '#2563eb',
                color: '#ffffff',
                borderRadius: 12,
              },
            },
          },
        }}
      />
    </div>
  );
};
