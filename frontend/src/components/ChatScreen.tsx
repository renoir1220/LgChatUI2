import React, { useEffect, useRef, useState } from 'react';
import {
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  // type GetProp,
} from '@ant-design/x';
import { Avatar, Button, Flex, Space, Spin, Typography, message } from 'antd';
import MarkdownIt from 'markdown-it';
import 'github-markdown-css/github-markdown.css';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { CitationList } from './CitationList';
import { useKnowledgeBases } from '../hooks/useKnowledgeBases';
import { apiFetch, apiGet } from '../lib/api';
import { clearAuth, getUsername } from '../utils/auth';

const { Text } = Typography;

// 初始化 markdown-it 渲染器
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Markdown 渲染函数
const renderMarkdown = (content: string) => (
  <div 
    className="markdown-body"
    style={{ backgroundColor: 'transparent' }}
    dangerouslySetInnerHTML={{ __html: md.render(content || '') }}
  />
);

interface Citation {
  source: string;
  content: string;
  document_name: string;
  score: number;
  dataset_id: string;
  document_id: string;
  segment_id: string;
  position: number;
}

type BubbleDataType = {
  role: string;
  content: string;
  citations?: Citation[];
};

const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: '欢迎使用 ChatUI',
    group: '今天',
  },
];

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

const SENDER_PROMPTS = [
  {
    key: '1',
    description: '介绍产品',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: '获取帮助',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: '技术支持',
    icon: <FileSearchOutlined />,
  },
];

/**
 * ChatScreen 组件 - 主聊天界面
 * 
 * 功能说明：
 * - 提供完整的聊天界面，包含侧边栏会话列表和主聊天区域
 * - 支持知识库选择、会话管理、消息发送与接收
 * - 集成AI平台，支持流式响应和引用展示
 * - 支持文件上传和附件管理
 * 
 * 状态管理：
 * - messages: 当前会话的消息列表
 * - conversations: 用户会话列表
 * - conversationId: 当前会话ID
 * - currentKnowledgeBase: 当前选择的知识库
 * - loading: 消息发送状态
 */
const ChatScreen: React.FC = () => {
  const abortController = useRef<AbortController | null>(null);

  // 知识库管理 - 使用独立的知识库状态管理
  const { knowledgeBases, currentKnowledgeBase, setCurrentKnowledgeBase, loading: kbLoading } = useKnowledgeBases();

  // 状态管理 - 使用更清晰的命名和注释
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({}); // 存储所有会话的消息历史
  const [conversations, setConversations] = useState<any[]>(DEFAULT_CONVERSATIONS_ITEMS); // 会话列表数据
  const [conversationDetails, setConversationDetails] = useState<Record<string, any>>({}); // 存储会话详细信息
  const [curConversation, setCurConversation] = useState<string>(DEFAULT_CONVERSATIONS_ITEMS[0].key); // 当前选中的会话
  const [conversationId, setConversationId] = useState<string | undefined>(undefined); // 当前会话ID（UUID格式）
  const [attachmentsOpen, setAttachmentsOpen] = useState(false); // 附件上传面板开关状态
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]); // 已上传的文件列表
  const [inputValue, setInputValue] = useState(''); // 输入框内容
  const [messages, setMessages] = useState<BubbleDataType[]>([]); // 当前会话的消息列表
  const [loading, setLoading] = useState(false); // 消息发送加载状态

  // 事件处理
  const onSubmit = async (val: string) => {
    if (!val) return;

    if (loading) {
      message.warning('请求进行中，请等待当前请求完成');
      return;
    }

    setLoading(true);
    
    const userMessage = { role: 'user', content: val };
    const botMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', citations: [] }]);
    
    try {
      abortController.current?.abort();
      abortController.current = new AbortController();

      console.log('发送请求到后端:', {
        message: val,
        knowledgeBaseId: currentKnowledgeBase,
        currentKnowledgeBaseValue: currentKnowledgeBase
      });
      
      const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
      const baseBody: any = { message: val, knowledgeBaseId: currentKnowledgeBase };
      const sentConvId = isValidUUID(conversationId) ? conversationId : undefined;
      const makeBody = (withConv: boolean) => JSON.stringify(withConv && sentConvId ? { ...baseBody, conversationId: sentConvId } : baseBody);

      let response = await apiFetch(`/api/chat`, {
        method: 'POST',
        body: makeBody(true),
        signal: abortController.current.signal,
      });

      // 若因非法/无权限会话导致 404，自动重试不带会话ID（创建新会话）
      if (!response.ok && response.status === 404 && sentConvId) {
        response = await apiFetch(`/api/chat`, {
          method: 'POST',
          body: makeBody(false),
          signal: abortController.current.signal,
        });
      }

      // 读取并保存会话ID
      const respConvId = response.headers.get('X-Conversation-ID') || undefined;
      if (respConvId && respConvId !== conversationId) {
        setConversationId(respConvId);
        // 刷新侧边栏会话列表
        try {
          const list = await apiGet<any[]>(`/api/conversations`);
          setConversations(list.map((c: any) => ({ key: c.id, label: c.title, group: '最近' })));
          
          // 更新会话详细信息
          const details: Record<string, any> = {};
          list.forEach(c => {
            details[c.id] = c;
          });
          setConversationDetails(details);
          
          setCurConversation(respConvId);
        } catch {}
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.substring(6);
              if (rawData.includes('[DONE]')) {
                return;
              }
              try {
                const jsonData = JSON.parse(rawData);
                
                // 文本增量
                if (jsonData.event === 'agent_message' || jsonData.event === 'message') {
                  setMessages(prev => prev.map((msg, index) => {
                    if (index === botMessageIndex && msg.role === 'assistant') {
                      return { ...msg, content: msg.content + (jsonData.answer || '') };
                    }
                    return msg;
                  }));
                }

                // 处理知识库引用数据 - 检查所有可能的来源
                const retrieverResources = jsonData?.metadata?.retriever_resources;
                if (retrieverResources && Array.isArray(retrieverResources) && retrieverResources.length > 0) {
                  setMessages(prev => prev.map((msg, index) => {
                    if (index === botMessageIndex && msg.role === 'assistant') {
                      const withCitations = retrieverResources.map((r: any) => ({
                        source: r.document_name || r.dataset_name || '未知来源',
                        content: r.content,
                        document_name: r.document_name,
                        score: r.score,
                        dataset_id: r.dataset_id,
                        document_id: r.document_id,
                        segment_id: r.segment_id,
                        position: r.position,
                      }));
                      return {
                        ...msg,
                        citations: withCitations,
                      };
                    }
                    return msg;
                  }));
                }
              } catch (e) {
                console.error('流式数据JSON解析失败:', e, '原始数据:', rawData);
              }
            }
          }
        }
      };

      await processStream();
      
      // 获取最终的助手消息状态并输出调试信息
      setMessages(prev => {
        const finalMessages = [...prev];
        const lastAssistantMsg = finalMessages[botMessageIndex];
        if (lastAssistantMsg?.role === 'assistant') {
          console.log('=== 流式响应完成 ===');
          console.log('最终消息内容长度:', lastAssistantMsg.content?.length || 0);
          console.log('知识库引用数量:', lastAssistantMsg.citations?.length || 0);
          if (lastAssistantMsg.citations && lastAssistantMsg.citations.length > 0) {
            console.log('引用数据详情:', lastAssistantMsg.citations.map(c => ({
              source: c.source,
              score: c.score,
              contentLength: c.content?.length || 0
            })));
          }
          console.log('========================');
        }
        return finalMessages;
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('请求失败:', error);
        const errorMessage = { 
          role: 'assistant', 
          content: `请求失败: ${error instanceof Error ? error.message : '网络错误'}`, 
          citations: []
        };
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[botMessageIndex]) {
            newMessages[botMessageIndex] = errorMessage;
          } else {
            newMessages.push(errorMessage);
          }
          return newMessages;
        });
      }
    } finally {
      setLoading(false);
      abortController.current = null;
    }
  };

  // 新建会话
  const handleNewConversation = () => {
    if (loading) {
      alert('消息发送中，请等待请求完成后再创建新会话');
      return;
    }

    setConversationId(undefined);
    setCurConversation('new');
    setMessages([]);
  };

  // 加载会话列表
  useEffect(() => {
    (async () => {
      try {
        const list = await apiGet<any[]>(`/api/conversations`);
        if (Array.isArray(list) && list.length > 0) {
          setConversations(list.map((c) => ({ key: c.id, label: c.title, group: '最近' })));
          
          // 存储会话详细信息
          const details: Record<string, any> = {};
          list.forEach(c => {
            details[c.id] = c;
          });
          setConversationDetails(details);
          
          setCurConversation(list[0].id);
          setConversationId(list[0].id);
          
          // 如果首个会话有知识库ID，自动设置
          if (list[0].knowledgeBaseId) {
            setCurrentKnowledgeBase(list[0].knowledgeBaseId);
          }
          
          // 加载首个会话消息（404 视为空列表）
          try {
            const msgs = await apiGet<any[]>(`/api/conversations/${list[0].id}`);
            const mapped = msgs.map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }));
            setMessages(mapped);
          } catch (e) {
            setMessages([]);
          }
        }
      } catch (e) {
        console.warn('加载会话失败或未登录:', e);
      }
    })();
  }, []);

  // 组件渲染
  const chatSider = (
    <div style={{ width: 280, height: '100vh', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0' }}>
        <img
          src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>ChatUI</span>
      </div>

      {/* 新建会话按钮 */}
      <Button
        onClick={handleNewConversation}
        type="link"
        style={{ margin: '8px 16px', textAlign: 'left' }}
        icon={<PlusOutlined />}
      >
        新建会话
      </Button>

      {/* 会话列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Conversations
          items={conversations}
          activeKey={curConversation}
          onActiveChange={async (val) => {
            abortController.current?.abort();
            setTimeout(() => {
              setCurConversation(val);
              setConversationId(typeof val === 'string' ? val : undefined);
              
              // 加载该会话历史
              if (val && val !== 'new') {
                // 从会话详细信息中获取知识库ID并自动设置
                const conversationDetail = conversationDetails[val as string];
                if (conversationDetail && conversationDetail.knowledgeBaseId) {
                  setCurrentKnowledgeBase(conversationDetail.knowledgeBaseId);
                }
                
                apiGet<any[]>(`/api/conversations/${val}`).then(msgs => {
                  const mapped = msgs.map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }));
                  setMessages(mapped);
                }).catch(() => setMessages([]));
              } else {
                setMessages([]);
              }
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
                  const newList = conversations.filter((item) => item.key !== conversation.key);
                  const newKey = newList?.[0]?.key;
                  setConversations(newList);
                  setTimeout(() => {
                    if (conversation.key === curConversation) {
                      setCurConversation(newKey);
                      setMessages(messageHistory?.[newKey] || []);
                    }
                  }, 200);
                },
              },
            ],
          })}
        />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size={24} icon={<SmileOutlined />} />
        <Button type="text" icon={<QuestionCircleOutlined />} />
        <Button type="text" icon={<CodeOutlined />} onClick={() => window.location.href = '/debug-api'} />
      </div>
    </div>
  );

  const chatList = (
    <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
      {messages?.length ? (
        <Bubble.List
          items={messages.map((msg, index) => ({
            ...msg,
            classNames: {
              content: loading && index === messages.length - 1 && msg.role === 'assistant' ? 'loading-message' : '',
            },
            typing: loading && index === messages.length - 1 && msg.role === 'assistant' ? { step: 5, interval: 20 } : false,
            footer: msg.role === 'assistant'
              ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {msg.citations && msg.citations.length > 0 ? (
                      <CitationList citations={msg.citations} />
                    ) : null}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="text" size="small" icon={<ReloadOutlined />} />
                      <Button type="text" size="small" icon={<CopyOutlined />} />
                      <Button type="text" size="small" icon={<LikeOutlined />} />
                      <Button type="text" size="small" icon={<DislikeOutlined />} />
                    </div>
                  </div>
                )
              : undefined,
          }))}
          style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}
          roles={{
            assistant: {
              placement: 'start',
              avatar: { icon: '🤖', style: { background: '#f0f0f0' } },
              loadingRender: () => <Spin size="small" />,
              messageRender: (content) => renderMarkdown(content),
            },
            user: { 
              placement: 'end', 
              avatar: { icon: <SmileOutlined />, style: { background: '#1890ff' } },
              messageRender: (content) => renderMarkdown(content)
            },
          }}
        />
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)', height: '100%', justifyContent: 'center' }}
        >
          <Welcome
            variant="borderless"
            icon="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            title="欢迎使用 ChatUI"
            description="基于 AI 平台的智能对话系统，为您提供专业的问答服务"
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
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
      )}
    </div>
  );

  const senderHeader = (
    <Sender.Header
      title="上传文件"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
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

  const chatSender = (
    <div style={{ padding: '16px' }}>
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info) => {
          onSubmit(info.data.description as string);
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        style={{ marginBottom: 16 }}
      />
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          abortController.current?.abort();
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        placeholder="输入消息或使用技能"
        actions={(_, info) => {
          const { SendButton, LoadingButton } = info.components;
          return (
            <Flex gap={4}>
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </Flex>
          );
        }}
      />
    </div>
  );

  useEffect(() => {
    if (messages?.length) {
      setMessageHistory((prev) => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {chatSider}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
          <KnowledgeBaseSelector 
            items={knowledgeBases}
            value={currentKnowledgeBase}
            onChange={setCurrentKnowledgeBase}
            loading={kbLoading}
          />
          <span style={{ flex: 1 }} />
          <Text type="secondary">用户：</Text>
          <span>{getUsername() || '-'}</span>
          <Button size="small" onClick={() => { clearAuth(); window.location.href = '/login'; }}>退出</Button>
        </div>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default ChatScreen;