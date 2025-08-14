import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxViewerProps {
  images: LightboxImage[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * 大图查看器组件
 * 支持多图切换、键盘导航、全屏显示
 */
export const LightboxViewer: React.FC<LightboxViewerProps> = ({
  images,
  initialIndex = 0,
  visible,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (images.length > 1) {
            setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
          }
          break;
        case 'ArrowRight':
          if (images.length > 1) {
            setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, images.length, onClose]);

  if (!visible || !images.length) return null;

  const currentImage = images[currentIndex];

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: 20
  };

  const imageStyle: React.CSSProperties = {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
    borderRadius: 8
  };

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    borderRadius: '50%',
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 18,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      {/* 关闭按钮 */}
      <Button
        style={{
          ...buttonStyle,
          top: 20,
          right: 20
        }}
        onClick={onClose}
        icon={<CloseOutlined />}
      />

      {/* 左箭头 */}
      {images.length > 1 && (
        <Button
          style={{
            ...buttonStyle,
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          onClick={handlePrevious}
          icon={<LeftOutlined />}
        />
      )}

      {/* 主图片 */}
      <img
        src={currentImage.src}
        alt={currentImage.alt}
        style={imageStyle}
      />

      {/* 右箭头 */}
      {images.length > 1 && (
        <Button
          style={{
            ...buttonStyle,
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          onClick={handleNext}
          icon={<RightOutlined />}
        />
      )}

      {/* 图片计数器 */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};