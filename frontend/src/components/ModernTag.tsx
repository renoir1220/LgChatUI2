import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, TagOutlined } from '@ant-design/icons';

export type TagVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gradient';
export type TagSize = 'small' | 'medium' | 'large';

interface ModernTagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ModernTag: React.FC<ModernTagProps> = ({
  children,
  variant = 'neutral',
  size = 'medium',
  icon,
  closable = false,
  onClose,
  className = '',
  style = {},
}) => {
  // 根据变体获取样式
  const getVariantStyles = (variant: TagVariant): React.CSSProperties => {
    const variants = {
      primary: {
        backgroundColor: '#e6f3ff',
        color: '#1677ff',
        border: 'none',
      },
      success: {
        backgroundColor: '#f0f9f0',
        color: '#52c41a',
        border: 'none',
      },
      warning: {
        backgroundColor: '#fffbe6',
        color: '#d4a122',
        border: 'none',
      },
      danger: {
        backgroundColor: '#fff2f0',
        color: '#ff4d4f',
        border: 'none',
      },
      info: {
        backgroundColor: '#e6f9ff',
        color: '#13c2c2',
        border: 'none',
      },
      neutral: {
        backgroundColor: '#fafafa',
        color: '#595959',
        border: 'none',
      },
      gradient: {
        backgroundColor: '#f0f2f5',
        color: '#434343',
        border: 'none',
      },
    };
    return variants[variant];
  };

  // 根据尺寸获取样式
  const getSizeStyles = (size: TagSize): React.CSSProperties => {
    const sizes = {
      small: {
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '10px',
        height: '20px',
        lineHeight: '16px',
      },
      medium: {
        fontSize: '12px',
        padding: '4px 12px',
        borderRadius: '12px',
        height: '24px',
        lineHeight: '16px',
      },
      large: {
        fontSize: '14px',
        padding: '6px 16px',
        borderRadius: '14px',
        height: '28px',
        lineHeight: '16px',
      },
    };
    return sizes[size];
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
    position: 'relative',
    ...getSizeStyles(size),
    ...getVariantStyles(variant),
    ...style,
  };

  const hoverStyles: React.CSSProperties = {
    transform: 'scale(1.02)',
    opacity: 0.8,
  };

  return (
    <span
      className={`modern-tag ${className}`}
      style={baseStyles}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyles);
      }}
    >
      {icon && <span style={{ fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px' }}>{icon}</span>}
      <span>{children}</span>
      {closable && (
        <span
          onClick={onClose}
          style={{
            cursor: 'pointer',
            marginLeft: '4px',
            fontSize: size === 'small' ? '10px' : '12px',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          ×
        </span>
      )}
    </span>
  );
};

// 预设的标签组件
export const StatusTag: React.FC<{ status: 'active' | 'pending' | 'completed' | 'error'; children: React.ReactNode }> = ({ status, children }) => {
  const statusConfig = {
    active: { variant: 'success' as TagVariant, icon: <CheckCircleOutlined /> },
    pending: { variant: 'warning' as TagVariant, icon: <ClockCircleOutlined /> },
    completed: { variant: 'info' as TagVariant, icon: <InfoCircleOutlined /> },
    error: { variant: 'danger' as TagVariant, icon: <ExclamationCircleOutlined /> },
  };
  
  const config = statusConfig[status];
  return <ModernTag variant={config.variant} icon={config.icon}>{children}</ModernTag>;
};

export const VersionTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModernTag variant="primary" size="small" icon={<TagOutlined />}>
    {children}
  </ModernTag>
);

export const CategoryTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModernTag variant="gradient" size="medium">
    {children}
  </ModernTag>
);

export default ModernTag;