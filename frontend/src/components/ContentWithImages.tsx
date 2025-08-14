import React, { useState } from 'react';
import { ImageThumb } from './ImageThumb';
import { LightboxViewer } from './LightboxViewer';
import type { LightboxImage } from './LightboxViewer';
import { extractImagesFromText, isSingleImageContent } from '../utils/imageUtils';

interface ContentWithImagesProps {
  content: string;
  style?: React.CSSProperties;
}

/**
 * 带图片显示的内容组件
 * 支持单图片居中显示和混合内容中的图片展示
 */
export const ContentWithImages: React.FC<ContentWithImagesProps> = ({ 
  content, 
  style = {} 
}) => {
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  // 提取图片信息
  const allImages = extractImagesFromText(content);
  
  // 检查是否为单图片内容
  const isSingleImage = isSingleImageContent(content);

  const handleImageClick = (images: LightboxImage[], initialIndex: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(initialIndex);
    setLightboxVisible(true);
  };

  // 如果是单图片内容，居中显示
  if (isSingleImage && allImages.length === 1) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '8px 0', ...style }}>
          <ImageThumb
            src={allImages[0].fullUrl}
            alt={allImages[0].alt}
            onClick={() => handleImageClick(
              allImages.map(img => ({ src: img.fullUrl, alt: img.alt })), 
              0
            )}
          />
        </div>
        <LightboxViewer
          images={lightboxImages}
          initialIndex={lightboxInitialIndex}
          visible={lightboxVisible}
          onClose={() => setLightboxVisible(false)}
        />
      </>
    );
  }

  // 混合内容处理：将图片替换为占位符，然后在文本下方显示图片
  if (allImages.length > 0) {
    // 替换文本中的图片为占位符
    let processedContent = content;
    const imageRegex = /(!\[([^\]]*)\]\(([^)]+)\))|(\[image\]\(([^)]+)\))|(<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>)|(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
    
    processedContent = processedContent.replace(imageRegex, () => {
      // 返回一个简短的占位符，避免文本过于冗长
      return '[图片]';
    });

    return (
      <>
        <div style={{ ...style }}>
          {/* 处理后的文本内容 */}
          <div style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: allImages.length > 0 ? 12 : 0
          }}>
            {processedContent}
          </div>
          
          {/* 图片网格 */}
          {allImages.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 8,
              marginTop: 8
            }}>
              {allImages.map((image, index) => (
                <ImageThumb
                  key={index}
                  src={image.fullUrl}
                  alt={image.alt}
                  onClick={() => handleImageClick(
                    allImages.map(img => ({ src: img.fullUrl, alt: img.alt })),
                    index
                  )}
                />
              ))}
            </div>
          )}
        </div>
        
        <LightboxViewer
          images={lightboxImages}
          initialIndex={lightboxInitialIndex}
          visible={lightboxVisible}
          onClose={() => setLightboxVisible(false)}
        />
      </>
    );
  }

  // 纯文本内容，直接显示
  return (
    <div style={{ 
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      ...style 
    }}>
      {content}
    </div>
  );
};