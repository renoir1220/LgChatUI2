import React from 'react';
import { Tooltip } from 'antd';
import InfoFeedIcon from './InfoFeedIcon';
import { apiGet } from '../../shared/services/api';

interface InfoFeedEntryProps {
  onClick: () => void;
}

// 本地存储键：记录用户上次查看信息流的时间戳
const LS_KEY_LAST_SEEN = 'infofeed:last_seen';

export const InfoFeedEntry: React.FC<InfoFeedEntryProps> = ({ onClick }) => {
  const [hover, setHover] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hasNew, setHasNew] = React.useState(false);

  // 响应式：<768 仅图标；>=768 胶囊按钮
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // 检查是否有新的信息流（与上次查看时间比较）
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 取最新一条的发布时间，后端默认按发布时间降序
        const data: any = await apiGet(`/api/infofeed?limit=1`);
        const latest = data?.data?.[0]?.publish_time || data?.data?.[0]?.publishTime;
        if (!latest) return;
        const latestTs = new Date(latest).getTime();
        const lastSeenStr = localStorage.getItem(LS_KEY_LAST_SEEN);
        const lastSeen = lastSeenStr ? Number(lastSeenStr) : 0;
        if (mounted) setHasNew(latestTs > lastSeen);
      } catch {
        // 静默失败：不显示红点
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleClick = () => {
    try {
      localStorage.setItem(LS_KEY_LAST_SEEN, String(Date.now()));
    } catch {}
    onClick();
  };

  // 颜色与样式
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
      <InfoFeedIcon />
      {!isMobile && <span style={{ fontSize: 13, fontWeight: 500 }}>信息流</span>}
      {/* 红点提示 */}
      {hasNew && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            backgroundColor: '#EF4444',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Tooltip title="信息流" placement="bottom">
        {content}
      </Tooltip>
    );
  }
  return content;
};

export default InfoFeedEntry;

