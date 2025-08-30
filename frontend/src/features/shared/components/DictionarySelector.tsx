import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, List, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { smartFilterCustomers } from '../utils/smartFilter';

export interface DictionaryItem {
  customerId: string;
  customerName: string;
  pyCode: string;
}

export interface DictionarySelectorProps {
  dictionaries: DictionaryItem[];
  onSelect: (dictionary: DictionaryItem) => void;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
}

export const DictionarySelector: React.FC<DictionarySelectorProps> = ({
  dictionaries,
  onSelect,
  onClose,
  isOpen,
  title = '选择字典'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDictionaries = useMemo(() => {
    // 使用智能匹配函数，支持优先级排序和高级匹配
    // 初始状态显示5条，搜索时显示20条
    const maxResults = searchTerm.trim() ? 20 : 5;
    return smartFilterCustomers(dictionaries, searchTerm, maxResults);
  }, [dictionaries, searchTerm]);

  const handleSelect = (dictionary: DictionaryItem) => {
    onSelect(dictionary);
    setSearchTerm(''); // 重置搜索
  };

  const handleClose = () => {
    setSearchTerm(''); // 重置搜索
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 回车选择第一个
      if (filteredDictionaries.length > 0) {
        handleSelect(filteredDictionaries[0]);
      }
    } else if (e.key === 'Escape') {
      // ESC关闭
      handleClose();
    }
  };

  // Modal打开时聚焦到搜索框
  useEffect(() => {
    if (isOpen) {
      // 延迟一下确保Modal完全渲染
      setTimeout(() => {
        const input = document.querySelector('.dictionary-search-input input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  return (
    <Modal
      title={<div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{title}</span></div>}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={400}
      destroyOnHidden
      centered
    >
      <div style={{ marginBottom: 12 }}>
        <Input
          className="dictionary-search-input"
          placeholder="输入中文或拼音搜索..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        {filteredDictionaries.length === 0 ? (
          <Empty 
            description={searchTerm ? '未找到匹配的客户' : '暂无客户数据'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            size="small"
            dataSource={filteredDictionaries}
            renderItem={(dictionary) => (
              <List.Item
                onClick={() => handleSelect(dictionary)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                style={{ 
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 36,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  <div>{dictionary.customerName}</div>
                  {searchTerm.trim() && (
                    <div style={{ 
                      fontSize: 11, 
                      color: '#999', 
                      marginTop: 2 
                    }}>
                      {dictionary.pyCode}
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
        
        {filteredDictionaries.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '8px 16px', 
            fontSize: 12, 
            color: '#666',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}>
            {searchTerm.trim() 
              ? `显示前 ${Math.min(filteredDictionaries.length, 20)} 个最佳匹配`
              : `显示前 ${Math.min(filteredDictionaries.length, 5)} 个客户`
            }
          </div>
        )}
      </div>
    </Modal>
  );
};
