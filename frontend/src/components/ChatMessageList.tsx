import React from 'react';
import { Bubble, Welcome, Prompts } from '@ant-design/x';
import { Flex, Space, Spin, message, Divider } from 'antd';
import { Button as AntdButton } from 'antd';
import { Button } from './ui/button';
import { Copy, RotateCcw } from 'lucide-react';
import {
  ShareAltOutlined,
  EllipsisOutlined,
  SmileOutlined,
  HeartOutlined,
  CommentOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import MarkdownIt from 'markdown-it';
import 'github-markdown-css/github-markdown.css';
import './ChatMessage.css';
import { CitationList } from './CitationList';
import { VoicePlayer } from './ui/VoicePlayer';
import type { BubbleDataType } from '../hooks/useChatState';

// 初始化 markdown-it 渲染器
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Markdown 渲染函数
const renderMarkdown = (content: string, isUser = false) => (
  <div 
    className={`markdown-body chat-markdown-body ${isUser ? 'user-message' : ''}`}
    style={{ backgroundColor: 'transparent' }}
    dangerouslySetInnerHTML={{ __html: md.render(content || '') }}
  />
);

// 热门话题配置
const HOT_TOPICS = {
  key: '1',
  label: '热门话题',
  children: [
    {
      key: '1-1',
      description: '如何使用 ChatUI？',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: '探索 AI 对话功能',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: '开始使用知识库问答',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
  ],
};

// 功能指南配置
const DESIGN_GUIDE = {
  key: '2',
  label: '功能指南',
  children: [
    {
      key: '2-1',
      icon: <HeartOutlined />,
      label: '智能对话',
      description: '与 AI 进行自然语言交流',
    },
    {
      key: '2-2',
      icon: <CommentOutlined />,
      label: '知识问答',
      description: '基于知识库提供专业回答',
    },
    {
      key: '2-3',
      icon: <FileSearchOutlined />,
      label: '文档理解',
      description: '上传文档进行智能分析',
    },
  ],
};

interface ChatMessageListProps {
  messages: BubbleDataType[];
  loading: boolean;
  currentKnowledgeBase: string | undefined;
  onSubmit: (message: string) => void;
  onRegenerate: (messageIndex: number) => void;
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
}) => {
  // 复制消息到剪贴板
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
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

  // 如果没有消息，显示欢迎界面
  if (!messages || messages.length === 0) {
    return (
      <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
        <Space
          direction="vertical"
          size={16}
          style={{ 
            paddingInline: 'max(16px, calc((100% - 700px) / 2))', 
            height: '100%', 
            justifyContent: 'center' 
          }}
        >
          <Welcome
            variant="borderless"
            icon="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            title="欢迎使用 ChatUI"
            description="基于 AI 平台的智能对话系统，为您提供专业的问答服务"
            extra={
              <Space>
                <AntdButton icon={<ShareAltOutlined />} />
                <AntdButton icon={<EllipsisOutlined />} />
              </Space>
            }
          />
          <Flex gap={16}>
            <Prompts
              items={[HOT_TOPICS]}
              styles={{
                list: { height: '100%' },
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
            />

            <Prompts
              items={[DESIGN_GUIDE]}
              styles={{
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { background: '#ffffffa6' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
            />
          </Flex>
        </Space>
      </div>
    );
  }

  // 渲染消息列表
  return (
    <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
      <Bubble.List
        items={messages.map((msg, index) => {
          const isStreamingAssistant = loading && index === messages.length - 1 && msg.role === 'assistant';
          
          // 处理消息内容，包括引用
          const contentNode = (!isStreamingAssistant && msg.role === 'assistant' && msg.citations && msg.citations.length > 0)
            ? (
                <div>
                  {renderMarkdown(msg.content, false)}
                  <Divider style={{ margin: '8px 0' }} />
                  <CitationList citations={msg.citations} kbId={currentKnowledgeBase} />
                </div>
              )
            : msg.content;

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
            avatar: { 
              icon: '🤖', 
              style: { 
                background: '#f6f8fa',
                border: '1px solid #e1e4e8',
                width: '32px',
                height: '32px'
              } 
            },
            loadingRender: () => <Spin size="small" />,
            messageRender: (content: React.ReactNode) => {
              if (typeof content === 'string') {
                return renderMarkdown(content, false);
              }
              return content;
            },
            // styles: {
            //   bubble: {
            //     background: '#ffffff',
            //     border: '1px solid #e1e4e8',
            //     borderRadius: '12px',
            //     padding: '12px 16px',
            //     boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            //     maxWidth: '100%'
            //   }
            // }
          },
          user: { 
            placement: 'end', 
            avatar: { 
              icon: <SmileOutlined />, 
              style: { 
                background: '#2563eb',
                width: '32px',
                height: '32px'
              } 
            },
            messageRender: (content) => renderMarkdown(content as string, true),
            // styles: {
            //   bubble: {
            //     background: '#2563eb',
            //     color: '#ffffff',
            //     borderRadius: '12px',
            //     padding: '12px 16px',
            //     maxWidth: '100%'
            //   }
            // }
          },
        }}
      />
    </div>
  );
};