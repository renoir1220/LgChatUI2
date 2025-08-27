import React from 'react';

interface TopBarProps {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  withDivider?: boolean; // show bottom divider when no subheader
  dense?: boolean; // slightly tighter horizontal padding
}

const TopBar: React.FC<TopBarProps> = ({ title, right, className = '', withDivider = true, dense = false }) => {
  return (
    <div className={`flex-shrink-0 ${withDivider ? 'border-b border-gray-200 dark:border-gray-800' : ''} ${className}`} style={{ height: 60 }}>
      <div className={`h-full ${dense ? 'px-2 md:px-4' : 'px-4 md:px-6'}`}>
        <div className="mx-auto max-w-3xl h-full flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {/* 单行截断，保持高度不抖动 */}
            <div className="text-[22px] md:text-2xl font-semibold text-foreground truncate">
              {title}
            </div>
          </div>
          <div className="pl-3 flex items-center">{right}</div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
