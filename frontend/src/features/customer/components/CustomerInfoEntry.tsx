import React from 'react';
import { Tooltip } from 'antd';
import CustomerInfoIcon from './CustomerInfoIcon';

interface CustomerInfoEntryProps {
  onClick: () => void;
}

export const CustomerInfoEntry: React.FC<CustomerInfoEntryProps> = ({ onClick }) => {
  const [hover, setHover] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // 响应式：<768 仅图标；>=768 胶囊按钮
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleClick = () => {
    onClick();
  };

  // 颜色与样式 - 与信息流保持一致
  const color = hover ? '#2563EB' : '#6B7280';
  const bg = hover ? '#EFF6FF' : 'transparent';

  const content = (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 16,
        padding: '6px 10px',
        cursor: 'pointer',
        color,
        background: bg,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <CustomerInfoIcon />
      {!isMobile && <span style={{ fontSize: 13, fontWeight: 500 }}>客户信息</span>}
    </div>
  );

  if (isMobile) {
    return (
      <Tooltip title="客户信息" placement="bottom">
        {content}
      </Tooltip>
    );
  }
  return content;
};

export default CustomerInfoEntry;