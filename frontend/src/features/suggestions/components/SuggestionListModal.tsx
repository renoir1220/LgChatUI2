import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, List, Tag, Empty, Spin, message, Typography, Button } from 'antd';
import { BulbOutlined, LoadingOutlined, BulbFilled, PlusOutlined } from '@ant-design/icons';
import { suggestionsApi } from '../api/suggestions-api';
import type { Suggestion, SuggestionStatus } from '@lg/shared';

const { Text, Paragraph } = Typography;

export interface SuggestionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuggestion?: () => void; // 新建议回调
}

// 状态颜色和文本映射
const STATUS_CONFIG = {
  0: { color: 'blue', text: '新提交' },      // NEW
  1: { color: 'green', text: '已解决' },     // RESOLVED  
  9: { color: 'red', text: '不做' },         // REJECTED
} as const;

export const SuggestionListModal: React.FC<SuggestionListModalProps> = ({
  isOpen,
  onClose,
  onCreateSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pageSize = 10;

  // 重置数据
  const resetData = () => {
    setSuggestions([]);
    setPage(1);
    setHasMore(true);
    setTotal(0);
    setLoading(false);
    setLoadingMore(false);
  };

  // 加载更多建议数据
  const loadMoreSuggestions = useCallback(async (pageNum: number) => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const response = await suggestionsApi.getSuggestions({
        page: pageNum,
        pageSize,
      });

      setSuggestions(prev => {
        const newList = [...prev, ...response.suggestions];
        setHasMore(newList.length < response.total);
        return newList;
      });
      
    } catch (error) {
      console.error('加载更多建议失败:', error);
      message.error('加载更多建议失败');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 当滚动到底部前100px时开始加载
    if (scrollHeight - scrollTop - clientHeight < 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMoreSuggestions(nextPage);
    }
  }, [hasMore, loadingMore, page, loadMoreSuggestions]);

  // 绑定滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 模态框打开时初始化数据
  useEffect(() => {
    if (isOpen) {
      resetData();
      // 直接调用加载函数，避免 useCallback 依赖问题
      const loadInitialData = async () => {
        setLoading(true);
        try {
          const response = await suggestionsApi.getSuggestions({
            page: 1,
            pageSize,
          });

          setSuggestions(response.suggestions);
          setTotal(response.total);
          setHasMore(response.suggestions.length < response.total);
        } catch (error) {
          console.error('加载建议列表失败:', error);
          message.error('加载建议列表失败');
        } finally {
          setLoading(false);
        }
      };
      
      loadInitialData();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetData();
    onClose();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined 
            style={{ 
              fontSize: 16, 
              color: '#666',
              filter: 'opacity(0.7)',
              textShadow: '0 0 1px rgba(102, 102, 102, 0.3)'
            }} 
          />
          建议列表 ({total}条)
          {onCreateSuggestion && (
            <Button
              type="link"
              size="small"
              onClick={onCreateSuggestion}
              style={{ 
                color: '#1677ff',
                fontSize: 14,
                height: 'auto',
                padding: 0,
                marginLeft: 8
              }}
            >
              提建议
            </Button>
          )}
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '70vh', overflow: 'hidden', padding: '16px 0' } }}
      destroyOnHidden
    >
      {suggestions.length === 0 && !loading ? (
        <Empty 
          description="暂无建议记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        />
      ) : (
        <div
          ref={scrollContainerRef}
          style={{ 
            height: '60vh',
            overflowY: 'auto',
            padding: '0 24px'
          }}
        >
            <List
              itemLayout="vertical"
              dataSource={suggestions}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    padding: '16px 0'
                  }}
                  extra={
                    <Tag color={STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.color || 'default'}>
                      {STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.text || '未知状态'}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>
                          {item.title}
                        </span>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          提交人: {item.submitterName} • 
                          提交时间: {formatDate(item.createdAt)}
                          {item.updatedAt !== item.createdAt && (
                            <> • 更新时间: {formatDate(item.updatedAt)}</>
                          )}
                        </Text>
                      </div>
                    }
                  />
                  
                  <Paragraph
                    style={{ 
                      marginBottom: item.developerReply ? 12 : 0,
                      color: '#666',
                      fontSize: 14,
                      lineHeight: 1.6
                    }}
                    ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                  >
                    {item.content}
                  </Paragraph>
                  
                  {item.developerReply && (
                    <div style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: 6,
                      padding: '12px',
                      marginTop: 12
                    }}>
                      <Text strong style={{ fontSize: 12, color: '#666', marginBottom: 6, display: 'block' }}>
                        开发回复:
                      </Text>
                      <Text style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                        {item.developerReply}
                      </Text>
                    </div>
                  )}
                </List.Item>
              )}
            />
            
            {/* 加载更多指示器 */}
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin indicator={<LoadingOutlined spin />} />
                <div style={{ marginTop: 8, color: '#999', fontSize: 14 }}>
                  加载更多中...
                </div>
              </div>
            )}
            
            {/* 到底提示 */}
            {!hasMore && suggestions.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                color: '#999', 
                fontSize: 14 
              }}>
                已加载全部 {total} 条建议
              </div>
            )}
        </div>
      )}
      
      {loading && suggestions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="加载建议列表中..." />
        </div>
      )}
    </Modal>
  );
};