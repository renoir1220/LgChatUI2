import React, { useState, useMemo } from 'react';
import { Button, Modal, Typography, Tag, Tooltip, Space } from 'antd';
import { ContentWithImages } from './ContentWithImages';

const { Text } = Typography;

export interface CitationItem {
  source: string;
  content: string;
  document_name?: string;
  score?: number;
  dataset_id?: string;
  document_id?: string;
  segment_id?: string;
  position?: number;
}

interface DocumentGroup {
  document_name: string;
  source: string;
  items: CitationItem[];
  count: number;
}

export const CitationList: React.FC<{ citations?: CitationItem[] }>
  = ({ citations = [] }) => {
  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentGroup | null>(null);

  console.log('CitationList渲染: citations=', citations, 'length=', citations?.length);

  if (!citations || citations.length === 0) {
    console.log('CitationList: 没有引用数据，返回null');
    return null;
  }

  const colors = ['blue','geekblue','purple','cyan','gold','lime'];

  // Group citations by document_name and source
  const groupedCitations = useMemo(() => {
    const groups: Map<string, DocumentGroup> = new Map();
    
    citations.forEach(item => {
      const key = `${item.document_name || item.source || '引用'}-${item.source}`;
      if (groups.has(key)) {
        groups.get(key)!.items.push(item);
      } else {
        groups.set(key, {
          document_name: item.document_name || item.source || '引用',
          source: item.source,
          items: [item],
          count: 0
        });
      }
    });

    // Sort items by position (descending) and update count
    groups.forEach(group => {
      group.items.sort((a, b) => (b.position || 0) - (a.position || 0));
      group.count = group.items.length;
    });

    const result = Array.from(groups.values());
    console.log('CitationList: 分组后的引用数据', result);
    return result;
  }, [citations]);

  const handleDocumentClick = (group: DocumentGroup) => {
    setSelectedDocument(group);
    setOpen(true);
  };

  console.log('CitationList: 开始渲染，分组数量=', groupedCitations.length);

  return (
    <div style={{ marginTop: 4 }}>
      <Text strong style={{ display: 'block', marginBottom: 4 }}>引用</Text>

      <Space size={[8,8]} wrap style={{ marginTop: 4 }}>
        {groupedCitations.map((group, idx) => {
          const title = group.document_name;
          const color = colors[idx % colors.length] as any;
          const short = title.length > 24 ? title.slice(0, 24) + '…' : title;
          const displayText = group.count > 1 ? `${short} (${group.count})` : short;
          
          return (
            <Tooltip key={idx} title={title} placement="top">
              <Tag
                color={color}
                onClick={() => handleDocumentClick(group)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {displayText}
              </Tag>
            </Tooltip>
          );
        })}
      </Space>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={selectedDocument?.document_name || '引用原文'}
        footer={null}
        width={720}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {selectedDocument?.items.map((item, index) => {
          return (
            <div key={index} style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>
                  #{index + 1} (位置: {item.position || '-'})
                </Text>
              </div>
              
              <div style={{ 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8
              }}>
                <ContentWithImages content={item.content || ''} />
              </div>
              
              <div style={{ marginTop: 12 }}>
                <Button
                  size="small"
                  type="text"
                  onClick={() => navigator.clipboard.writeText(item.content || '')}
                >
                  复制原文
                </Button>
              </div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  置信: {typeof item.score === 'number' ? item.score.toFixed(3) : '-'} 
                  {item.segment_id && ` | 片段: ${item.segment_id}`}
                </Text>
              </div>
            </div>
          );
        })}
      </Modal>
    </div>
  );
};
