import React from 'react';

const CustomerInfoIcon: React.FC = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* 客户图标：用户和一些数据点 */}
    <circle cx="12" cy="8" r="3" />
    <path d="M8 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="6" r="2" />
  </svg>
);

export default CustomerInfoIcon;