import React, { useState } from 'react';
import { ImageThumb } from './ImageThumb';
import { LightboxViewer } from './LightboxViewer';
import type { LightboxImage } from './LightboxViewer';
import { extractImagesFromText, isSingleImageContent } from '../utils/imageUtils';

interface ContentWithImagesProps {
  content: string;
  style?: React.CSSProperties;
}

interface ContentSegment {
  type: 'text' | 'image';
  content: string;
  imageInfo?: {
    src: string;
    fullUrl: string;
    alt: string;
    originalMatch: string;
  };
}

/**
 * 带图片显示的内容组件
 * 支持单图片居中显示和混合内容中的图片内联展示
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

  // 解析混合内容：将文本分割为文本段落和图片段落
  const parseContentSegments = (text: string): ContentSegment[] => {
    const segments: ContentSegment[] = [];
    const imageRegex = /(!\[([^\]]*)\]\(([^)]+)\))|(\[image\]\(([^)]+)\))|(\[图片\])|(<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>)|(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
    
    let lastIndex = 0;
    let match;
    let imageIndex = 0;

    while ((match = imageRegex.exec(text)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        const textContent = text.substring(lastIndex, match.index);
        if (textContent.trim()) {
          segments.push({
            type: 'text',
            content: textContent
          });
        }
      }

      // 添加图片
      let src = '';
      let alt = '';
      
      if (match[1]) {
        // Markdown format: ![alt](url)
        src = match[3];
        alt = match[2] || '图片';
      } else if (match[4]) {
        // Special format: [image](url)
        src = match[5];
        alt = '图片';
      } else if (match[6]) {
        // Placeholder format: [图片]
        segments.push({
          type: 'image',
          content: match[0],
          imageInfo: {
            src: '',
            fullUrl: '',
            alt: '图片占位符',
            originalMatch: match[0]
          }
        });
        lastIndex = match.index + match[0].length;
        continue;
      } else if (match[7]) {
        // HTML format: <img src="url" alt="alt" />
        src = match[8];
        alt = match[9] || '图片';
      } else if (match[10]) {
        // Direct URL
        src = match[10];
        alt = '图片';
      }

      if (src && imageIndex < allImages.length) {
        segments.push({
          type: 'image',
          content: match[0],
          imageInfo: {
            src,
            fullUrl: allImages[imageIndex].fullUrl,
            alt,
            originalMatch: match[0]
          }
        });
        imageIndex++;
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加最后的文本
    if (lastIndex < text.length) {
      const textContent = text.substring(lastIndex);
      if (textContent.trim()) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }

    return segments;
  };

  // 检查是否包含图片占位符
  const hasImagePlaceholders = content.includes('[图片]');

  // 混合内容处理：解析并内联显示图片
  if (allImages.length > 0 || hasImagePlaceholders) {
    const segments = parseContentSegments(content);

    return (
      <>
        <div style={{ ...style }}>
          {segments.map((segment, index) => {
            if (segment.type === 'text') {
              return (
                <span key={index} style={{ 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {segment.content}
                </span>
              );
            } else if (segment.type === 'image' && segment.imageInfo) {
              // 如果是占位符（没有真实的图片URL）
              if (!segment.imageInfo.fullUrl) {
                return (
                  <div key={index} style={{ 
                    display: 'block',
                    margin: '12px 0',
                    padding: '20px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: 8,
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                    color: '#999',
                    fontSize: 14
                  }}>
                    📷 图片暂未提供
                  </div>
                );
              }

              const imageIndexInAll = allImages.findIndex(img => 
                img.fullUrl === segment.imageInfo!.fullUrl
              );
              return (
                <div key={index} style={{ 
                  display: 'block',
                  margin: '12px 0',
                  textAlign: 'left'
                }}>
                  <ImageThumb
                    src={segment.imageInfo.fullUrl}
                    alt={segment.imageInfo.alt}
                    onClick={() => handleImageClick(
                      allImages.map(img => ({ src: img.fullUrl, alt: img.alt })),
                      imageIndexInAll >= 0 ? imageIndexInAll : 0
                    )}
                  />
                </div>
              );
            }
            return null;
          })}
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
