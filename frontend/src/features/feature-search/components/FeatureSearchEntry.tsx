import React from 'react';
import { Tooltip } from 'antd';
import FeatureSearchIcon from './FeatureSearchIcon';

interface FeatureSearchEntryProps {
  onClick: () => void;
}

export const FeatureSearchEntry: React.FC<FeatureSearchEntryProps> = ({ onClick }) => {
  const [hover, setHover] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const color = hover ? '#2563EB' : '#6B7280';
  const bg = hover ? '#EFF6FF' : 'transparent';

  const content = (
    <div
      onClick={onClick}
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
        userSelect: 'none',
      }}
    >
      <FeatureSearchIcon />
      {!isMobile && <span style={{ fontSize: 13, fontWeight: 500 }}>功能查询</span>}
    </div>
  );

  if (isMobile) {
    return (
      <Tooltip title="功能查询" placement="bottom">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default FeatureSearchEntry;
