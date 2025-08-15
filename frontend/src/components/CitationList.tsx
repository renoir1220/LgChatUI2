import React, { useState, useMemo } from 'react';
import { Button, Modal, Typography, Tag, Tooltip, Space } from 'antd';
import { 
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FilePptOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons';
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

export const CitationList: React.FC<{ citations?: CitationItem[]; kbId?: string }>
  = ({ citations = [], kbId }) => {
  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentGroup | null>(null);

  if (!citations || citations.length === 0) {
    return null;
  }

  // 文件类型解析与图标映射
  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === 'pdf') return <FilePdfOutlined />;
    if (e === 'doc' || e === 'docx') return <FileWordOutlined />;
    if (e === 'xls' || e === 'xlsx') return <FileExcelOutlined />;
    if (e === 'ppt' || e === 'pptx') return <FilePptOutlined />;
    if (e === 'txt' || e === 'md') return <FileTextOutlined />;
    return <FileUnknownOutlined />;
  };

  const getBaseNameAndExt = (name?: string) => {
    const n = (name || '').trim();
    if (!n) return { base: '引用', ext: '' };
    const lastDot = n.lastIndexOf('.');
    if (lastDot <= 0) return { base: n, ext: '' };
    return { base: n.slice(0, lastDot), ext: n.slice(lastDot + 1) };
  };

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

    return Array.from(groups.values());
  }, [citations]);

  const handleDocumentClick = (group: DocumentGroup) => {
    setSelectedDocument(group);
    setOpen(true);
  };

  return (
    <div style={{ marginTop: 4 }}>
      <Text strong style={{ display: 'block', marginBottom: 4 }}>引用</Text>

      <Space size={[8,8]} wrap style={{ marginTop: 4 }}>
        {groupedCitations.map((group, idx) => {
          const fullTitle = group.document_name;
          const { base, ext } = getBaseNameAndExt(fullTitle);
          const Icon = getFileIcon(ext);
          const short = base.length > 24 ? base.slice(0, 24) + '…' : base;
          const displayText = group.count > 1 ? `${short} (${group.count})` : short;
          
          return (
            <Tooltip key={idx} title={fullTitle} placement="top">
              <Tag
                onClick={() => handleDocumentClick(group)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>{Icon}</span>
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
                <ContentWithImages content={normalizeImageLinks(item.content || '')} />
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
  // 把 Dify 的签名URL改写为后端代理，避免过期
  const normalizeImageLinks = (content: string) => {
    if (!content) return content;
    try {
      const kbQuery = kbId ? `?kb=${encodeURIComponent(kbId)}` : '';
      return content
        .replace(/\[image\]\(\/files\/([0-9a-fA-F-]{36})\/file-preview[^)]*\)/g, (_m, id) => `[image](/api/files/${id}/preview${kbQuery})`)
        .replace(/!\[[^\]]*\]\(\/files\/([0-9a-fA-F-]{36})\/file-preview[^)]*\)/g, (_m, id) => `![image](/api/files/${id}/preview${kbQuery})`)
        .replace(/<img[^>]+src=\"\/files\/([0-9a-fA-F-]{36})\/file-preview[^\"]*\"[^>]*>/g, (_m, id) => `<img src="/api/files/${id}/preview${kbQuery}" />`);
    } catch {
      return content;
    }
  };
