import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, List, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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
    if (!searchTerm.trim()) {
      return dictionaries;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return dictionaries.filter(dictionary => {
      const name = dictionary.customerName.toLowerCase();
      const pinyin = dictionary.pyCode.toLowerCase();
      
      // 支持中文名称和拼音的模糊匹配
      return name.includes(term) || pinyin.includes(term);
    });
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
      title={title}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={400}
      destroyOnHidden
      centered
    >
      <div style={{ marginBottom: 16 }}>
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
      
      <div style={{ maxHeight: 240, overflow: 'auto' }}>
        {filteredDictionaries.length === 0 ? (
          <Empty 
            description={searchTerm ? '未找到匹配的字典' : '暂无字典数据'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            size="small"
            dataSource={filteredDictionaries.slice(0, 6)}
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
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ fontSize: '13px' }}>
                  {dictionary.customerName}
                </div>
              </List.Item>
            )}
          />
        )}
        
        {filteredDictionaries.length > 6 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '8px 16px', 
            fontSize: 12, 
            color: '#999',
            borderTop: '1px solid #f0f0f0'
          }}>
            还有 {filteredDictionaries.length - 6} 个结果，请输入更具体的搜索词
          </div>
        )}
      </div>
    </Modal>
  );
};