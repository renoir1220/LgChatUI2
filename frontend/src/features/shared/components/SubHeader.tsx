import React from 'react';

interface SubHeaderProps {
  children?: React.ReactNode;
  visible?: boolean;
  className?: string;
}

// A constrained-width subheader wrapper with subtle background.
const SubHeader: React.FC<SubHeaderProps> = ({ children, visible = true, className = '' }) => {
  if (!visible) return null;
  return (
    <div className={`flex-shrink-0 border-b border-gray-200 dark:border-gray-800 ${className}`} style={{ height: 44 }}>
      <div className="h-full px-4 md:px-6">
        <div className="mx-auto max-w-3xl h-full flex items-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SubHeader;
