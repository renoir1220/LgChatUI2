import React, { useState } from 'react';
import { Spin } from 'antd';
import './ImageThumb.css';

interface ImageThumbProps {
  src: string;
  alt: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * 图片缩略图组件
 * 固定尺寸：160×120px，支持加载状态和错误处理
 */
export const ImageThumb: React.FC<ImageThumbProps> = ({ 
  src, 
  alt, 
  onClick,
  style = {}
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const baseStyle: React.CSSProperties = {
    width: 160,
    height: 120,
    borderRadius: 8,
    cursor: onClick ? 'pointer' : 'default',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ...style
  };

  const hoverClass = onClick ? 'image-thumb-hover' : '';

  if (error) {
    return (
      <div
        style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px dashed #d9d9d9',
          color: '#999',
          fontSize: 12,
          textAlign: 'center'
        }}
        onClick={onClick}
      >
        加载失败
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {loading && (
        <div
          style={{
            ...baseStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            zIndex: 1
          }}
        >
          <Spin size="small" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={hoverClass}
        style={{
          ...baseStyle,
          opacity: loading ? 0 : 1
        }}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
      />
    </div>
  );
};