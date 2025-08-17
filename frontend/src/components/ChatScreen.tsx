import React, { useEffect, useRef, useState } from 'react';
import {
  CloudUploadOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ShareAltOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Copy, RotateCcw } from 'lucide-react';
import logoTree from '../assets/logoTree.png';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  // type GetProp,
} from '@ant-design/x';
import { Avatar, Flex, Space, Spin, message, Dropdown, Skeleton, Divider } from 'antd';
import { Button as AntdButton } from 'antd';
import { Button } from './ui/button';
import { DownOutlined, CheckOutlined, DatabaseOutlined } from '@ant-design/icons';
import MarkdownIt from 'markdown-it';
import 'github-markdown-css/github-markdown.css';
import './ChatMessage.css';
import { CitationList } from './CitationList';
import { VoicePlayer } from './ui/VoicePlayer';
import { useKnowledgeBases } from '../hooks/useKnowledgeBases';
import { apiFetch, apiGet } from '../lib/api';
import { clearAuth, getUsername } from '../utils/auth';
import { saveCitationsToCache, saveAssistantCitationsToCache, getCitationsFromCache, cleanupExpiredCache } from '../utils/messageCache';


// 初始化 markdown-it 渲染器
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Markdown 渲染函数 - 优化样式类名
const renderMarkdown = (content: string, isUser = false) => (
  <div 
    className={`markdown-body chat-markdown-body ${isUser ? 'user-message' : ''}`}
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

interface ConversationItem {
  key: string;
  label: string;
  group: string;
}

interface ConversationDetail {
  id: string;
  title: string;
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageRecord {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

type BubbleDataType = {
  role: string;
  content: string;
  citations?: Citation[];
};

interface StreamResponse {
  event: 'agent_message' | 'message';
  answer?: string;
  metadata?: {
    retriever_resources?: Array<{
      document_name?: string;
      dataset_name?: string;
      content: string;
      score: number;
      dataset_id: string;
      document_id: string;
      segment_id: string;
      position: number;
    }>;
  };
}

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

// 已移除底部“常用问题”快捷入口

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
  const [messageHistory, setMessageHistory] = useState<Record<string, BubbleDataType[]>>({}); // 存储所有会话的消息历史
  const [conversations, setConversations] = useState<ConversationItem[]>(DEFAULT_CONVERSATIONS_ITEMS); // 会话列表数据
  const [conversationDetails, setConversationDetails] = useState<Record<string, ConversationDetail>>({}); // 存储会话详细信息
  const [curConversation, setCurConversation] = useState<string>(DEFAULT_CONVERSATIONS_ITEMS[0].key); // 当前选中的会话
  const [conversationId, setConversationId] = useState<string | undefined>(undefined); // 当前会话ID（UUID格式）
  const [attachmentsOpen, setAttachmentsOpen] = useState(false); // 附件上传面板开关状态
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]); // 已上传的文件列表
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
    const botMessageIndex = messages.length + 1; // 旧的按数组下标
    const assistantOrdinal = messages.filter((m) => m.role === 'assistant').length + 1; // 第N条助手消息
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', citations: [] }]);
    
    try {
      abortController.current?.abort();
      abortController.current = new AbortController();

      // 消息交互：开始发送请求
      
      const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
      const baseBody = { message: val, knowledgeBaseId: currentKnowledgeBase };
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
          const list = await apiGet<ConversationDetail[]>(`/api/conversations`);
          setConversations(list.map((c) => ({ key: c.id, label: c.title, group: '最近' })));
          
          // 更新会话详细信息
          const details: Record<string, ConversationDetail> = {};
          list.forEach(c => {
            details[c.id] = c;
          });
          setConversationDetails(details);
          
          setCurConversation(respConvId);
        } catch (error) {
          console.error('刷新会话列表失败:', error);
        }
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
                const jsonData = JSON.parse(rawData) as StreamResponse;
                
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
                  const withCitations = retrieverResources.map((r) => ({
                    source: r.document_name || r.dataset_name || '未知来源',
                    content: r.content,
                    document_name: r.document_name,
                    score: r.score,
                    dataset_id: r.dataset_id,
                    document_id: r.document_id,
                    segment_id: r.segment_id,
                    position: r.position,
                  }));

                  setMessages(prev => prev.map((msg, index) => {
                    if (index === botMessageIndex && msg.role === 'assistant') {
                      // 保存引用信息到Cookie缓存（使用更稳定的助手序号作为键，并兼容旧键）
                      if (respConvId) {
                        saveAssistantCitationsToCache(respConvId, assistantOrdinal, withCitations);
                        // 兼容旧版本：同时写入旧的数组下标键，便于过渡
                        saveCitationsToCache(respConvId, botMessageIndex, withCitations);
                      }

                      return {
                        ...msg,
                        citations: withCitations,
                      };
                    }
                    return msg;
                  }));
                }
              } catch (e) {
                console.error('流式数据JSON解析失败:', e);
              }
            }
          }
        }
      };

      await processStream();
      
      // 获取最终的助手消息状态并输出调试信息
      setMessages(prev => [...prev]);

    } catch (error) {
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
    // 清理过期缓存
    cleanupExpiredCache();
    
    (async () => {
      try {
        const list = await apiGet<ConversationDetail[]>(`/api/conversations`);
        if (Array.isArray(list) && list.length > 0) {
          setConversations(list.map((c) => ({ key: c.id, label: c.title, group: '最近' })));
          
          // 存储会话详细信息
          const details: Record<string, ConversationDetail> = {};
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
            const msgs = await apiGet<MessageRecord[]>(`/api/conversations/${list[0].id}`);
            const cachedCitations = getCitationsFromCache(list[0].id);
            let assistantCount = 0;
            const mapped = msgs.map((m, index) => {
              const role = m.role === 'USER' ? 'user' : 'assistant';
              let citations: Citation[] = [];
              if (role === 'assistant') {
                assistantCount += 1;
                const byAssistantKey = cachedCitations[`a:${assistantCount}`] || [];
                const byLegacyIndex = cachedCitations[index.toString()] || [];
                citations = (byAssistantKey.length ? byAssistantKey : byLegacyIndex) as Citation[];
              }
              
              // 恢复历史引用（静默）
              
              return { 
                role, 
                content: m.content,
                citations
              };
            });
            setMessages(mapped);
          } catch (error) {
            console.error('加载会话消息失败:', error);
            setMessages([]);
          }
        }
      } catch (error) {
        // 静默处理：未登录或加载失败
        console.error('初始化加载失败:', error);
      }
    })();
  }, [setCurrentKnowledgeBase]);

  // 组件渲染
  const chatSider = (
    <div style={{ width: 280, height: '100vh', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0' }}>
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
                
                apiGet<MessageRecord[]>(`/api/conversations/${val}`).then(msgs => {
                  const cachedCitations = getCitationsFromCache(val as string);
                  let assistantCount = 0;
                  const mapped = msgs.map((m, index) => {
                    const role = m.role === 'USER' ? 'user' : 'assistant';
                    let citations: Citation[] = [];
                    if (role === 'assistant') {
                      assistantCount += 1;
                      const byAssistantKey = cachedCitations[`a:${assistantCount}`] || [];
                      const byLegacyIndex = cachedCitations[index.toString()] || [];
                      citations = (byAssistantKey.length ? byAssistantKey : byLegacyIndex) as Citation[];
                    }
                    
                    // 历史引用恢复，静默
                    
                    return { 
                      role, 
                      content: m.content,
                      citations
                    };
                  });
                  setMessages(mapped);
                }).catch((error) => {
                  console.error('加载会话失败:', error);
                  setMessages([]);
                });
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

      <div style={{ padding: '12px 12px', borderTop: '1px solid #f0f0f0' }}>
        <Dropdown
          placement="topLeft"
          menu={{
            items: [
              { key: 'profile', label: '个人资料' },
              { type: 'divider' as const },
              { key: 'logout', danger: true, label: '退出登录' },
            ],
            onClick: ({ key }) => {
              if (key === 'logout') {
                clearAuth();
                window.location.href = '/login';
              }
            },
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
            onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = '#f5f5f5'))}
            onMouseLeave={(e) => ((e.currentTarget.style.backgroundColor = 'transparent'))}
          >
            <Avatar size={28} icon={<SmileOutlined />} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontWeight: 500 }}>{getUsername() || '用户'}</span>
              <span style={{ fontSize: 12, color: '#999' }}>账户</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );

  const chatList = (
    <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
      {messages?.length ? (
        <Bubble.List
          items={messages.map((msg, index) => {
            // 渲染逻辑，无额外调试输出
            
            const isStreamingAssistant = loading && index === messages.length - 1 && msg.role === 'assistant';
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
                    <div className="message-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* 引用已内嵌到气泡内容中 */}
                    <div className="message-actions" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <VoicePlayer 
                        text={msg.content}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="复制消息"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content).then(() => {
                            message.success('消息已复制到剪贴板');
                          }).catch(() => {
                            message.error('复制失败');
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="重新生成"
                        onClick={async () => {
                          if (loading) {
                            message.warning('请等待当前请求完成后再重新生成');
                            return;
                          }
                          
                          // 找到对应的用户消息
                          const userMessageIndex = index - 1;
                          if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === 'user') {
                            const userMessage = messages[userMessageIndex].content;
                            
                            // 清空当前AI回复内容，准备重新生成
                            setMessages(prev => prev.map((item, i) => 
                              i === index ? { ...item, content: '', citations: [] } : item
                            ));
                            
                            setLoading(true);
                            
                            try {
                              abortController.current?.abort();
                              abortController.current = new AbortController();
                              
                              const isValidUUID = (s?: string) => !!s && /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
                              const baseBody = { message: userMessage, knowledgeBaseId: currentKnowledgeBase };
                              const sentConvId = isValidUUID(conversationId) ? conversationId : undefined;
                              const makeBody = (withConv: boolean) => JSON.stringify(withConv && sentConvId ? { ...baseBody, conversationId: sentConvId } : baseBody);

                              let response = await apiFetch(`/api/chat`, {
                                method: 'POST',
                                body: makeBody(true),
                                signal: abortController.current.signal,
                              });

                              if (!response.ok && response.status === 404 && sentConvId) {
                                response = await apiFetch(`/api/chat`, {
                                  method: 'POST',
                                  body: makeBody(false),
                                  signal: abortController.current.signal,
                                });
                              }

                              if (!response.body) {
                                throw new Error('响应体为空');
                              }

                              const reader = response.body.getReader();
                              const decoder = new TextDecoder('utf-8');
                              let buffer = '';

                              while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                buffer += decoder.decode(value, { stream: true });
                                const lines = buffer.split('\n\n');
                                buffer = lines.pop() || '';

                                for (const line of lines) {
                                  if (line.startsWith('data: ')) {
                                    const rawData = line.substring(6);
                                    if (rawData.includes('[DONE]')) continue;
                                    
                                    try {
                                      const jsonData = JSON.parse(rawData) as StreamResponse;
                                      
                                      // 在相同位置更新AI回复内容
                                      if (jsonData.event === 'agent_message' || jsonData.event === 'message') {
                                        setMessages(prev => prev.map((item, i) => 
                                          i === index ? { ...item, content: item.content + (jsonData.answer || '') } : item
                                        ));
                                      }

                                      // 处理引用数据
                                      const retrieverResources = jsonData?.metadata?.retriever_resources;
                                      if (retrieverResources && Array.isArray(retrieverResources) && retrieverResources.length > 0) {
                                        const withCitations = retrieverResources.map((r) => ({
                                          source: r.document_name || r.dataset_name || '未知来源',
                                          content: r.content,
                                          document_name: r.document_name,
                                          score: r.score,
                                          dataset_id: r.dataset_id,
                                          document_id: r.document_id,
                                          segment_id: r.segment_id,
                                          position: r.position,
                                        }));

                                        // 保存重新生成的引用信息到缓存，按助手序号键；兼容旧键
                                        if (conversationId) {
                                          const assistantOrdinalForIndex = (messages.slice(0, index + 1).filter((m) => m.role === 'assistant').length) || 1;
                                          saveAssistantCitationsToCache(conversationId, assistantOrdinalForIndex, withCitations);
                                          saveCitationsToCache(conversationId, index, withCitations);
                                        }

                                        setMessages(prev => prev.map((item, i) => {
                                          if (i === index) {
                                            return { ...item, citations: withCitations };
                                          }
                                          return item;
                                        }));
                                      }
                                    } catch (e) {
                                      console.error('流式数据JSON解析失败:', e);
                                    }
                                  }
                                }
                              }
                            } catch (error) {
                              if (error.name !== 'AbortError') {
                                console.error('重新生成失败:', error);
                                setMessages(prev => prev.map((item, i) => 
                                  i === index ? { ...item, content: `重新生成失败: ${error instanceof Error ? error.message : '网络错误'}`, citations: [] } : item
                                ));
                              }
                            } finally {
                              setLoading(false);
                              abortController.current = null;
                            }
                          } else {
                            message.error('未找到对应的用户消息');
                          }
                        }}
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
            paddingInline: 'max(16px, calc((100% - 800px) / 2))', // 响应式边距，最小16px
            paddingTop: '16px',
            paddingBottom: '16px'
          }}
          styles={{
            list: {
              gap: '16px' // 消息间距优化
            },
            item: {
              marginBottom: '8px' // 单个消息底部间距
            }
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
              styles: {
                bubble: {
                  background: '#ffffff',
                  border: '1px solid #e1e4e8',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  maxWidth: '100%'
                }
              }
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
              messageRender: (content) => renderMarkdown(content, true),
              styles: {
                bubble: {
                  background: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  maxWidth: '100%'
                }
              }
            },
          }}
        />
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'max(16px, calc((100% - 700px) / 2))', height: '100%', justifyContent: 'center' }}
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
        onChange={(info) => setAttachedFiles(info.fileList || [])}
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
    <div style={{ paddingInline: 'max(16px, calc((100% - 800px) / 2))', paddingTop: 8, paddingBottom: 16 }}>
      {/* 知识库选择（模仿 ChatGPT 模型选择样式，靠近输入框） */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {currentKnowledgeBase === kb.id ? (
                      <CheckOutlined style={{ color: '#1677ff' }} />
                    ) : (
                      <span style={{ width: 14 }} />
                    )}
                    <span>{kb.name}</span>
                  </div>
                ),
              })),
              onClick: ({ key }) => setCurrentKnowledgeBase(key as string),
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
          <AntdButton
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
        <div style={{ padding: '0 24px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
          {(() => {
            let title = '新对话';
            if (curConversation && curConversation !== 'new') {
              // 优先使用会话详情中的标题
              const detail = conversationDetails[curConversation];
              title = detail?.title
                || conversations.find((c) => c.key === curConversation)?.label
                || '对话';
            }
            return <span style={{ fontWeight: 500 }}>{title}</span>;
          })()}
          <span style={{ flex: 1 }} />
        </div>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default ChatScreen;
