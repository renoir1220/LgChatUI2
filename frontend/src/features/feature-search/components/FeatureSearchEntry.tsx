import React from 'react';
import { cn } from '@/features/shared/utils/utils';
import FeatureSearchIcon from './FeatureSearchIcon';

interface FeatureSearchEntryProps {
  onClick: () => void;
}

export const FeatureSearchEntry: React.FC<FeatureSearchEntryProps> = ({ onClick }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-xs font-medium text-slate-500 transition',
        'bg-white/0 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
      )}
      title="功能查询"
      aria-label="功能查询"
    >
      <FeatureSearchIcon />
      {!isMobile && <span className="tracking-wide">功能查询</span>}
    </button>
  );
};

export default FeatureSearchEntry;
