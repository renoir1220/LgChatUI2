import React, { useCallback, useState } from 'react';
import { Upload, Button, Image, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { bugService } from '../services/bugService';

interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

interface PreviewFile {
  uid: string;
  name: string;
  url: string;
  file?: File;
}

/**
 * BUG图片上传组件
 * 支持最多5张图片上传，带预览和删除功能
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  disabled = false,
}) => {
  const [fileList, setFileList] = useState<PreviewFile[]>(() => 
    value.map((url, index) => ({
      uid: `${index}`,
      name: `image-${index}`,
      url,
    }))
  );
  const [uploading, setUploading] = useState(false);

  // 文件选择前的验证
  const beforeUpload = useCallback((file: RcFile): boolean => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB！');
      return false;
    }

    if (fileList.length >= maxCount) {
      message.error(`最多只能上传${maxCount}张图片！`);
      return false;
    }

    return true;
  }, [fileList.length, maxCount]);

  // 文件选择处理
  const handleFileSelect = useCallback(async (file: RcFile) => {
    if (!beforeUpload(file)) {
      return;
    }

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    const newFile: PreviewFile = {
      uid: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: previewUrl,
      file,
    };

    const newFileList = [...fileList, newFile];
    setFileList(newFileList);

    // 上传文件
    setUploading(true);
    try {
      const results = await bugService.uploadImages([file]);
      const result = results[0];
      
      if (result.success && result.url) {
        // 更新文件列表，替换本地URL为服务器URL
        const updatedFileList = newFileList.map(f => 
          f.uid === newFile.uid 
            ? { ...f, url: result.url!, file: undefined }
            : f
        );
        setFileList(updatedFileList);
        
        // 通知父组件URL变更
        const urls = updatedFileList.map(f => f.url);
        onChange?.(urls);
        
        message.success('图片上传成功');
      } else {
        // 上传失败，移除文件
        setFileList(prev => prev.filter(f => f.uid !== newFile.uid));
        message.error(result.message || '图片上传失败');
      }
    } catch (error) {
      // 上传失败，移除文件
      setFileList(prev => prev.filter(f => f.uid !== newFile.uid));
      message.error('图片上传失败，请重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [fileList, maxCount, onChange]);

  // 删除图片
  const handleRemove = useCallback((uid: string) => {
    const newFileList = fileList.filter(file => file.uid !== uid);
    setFileList(newFileList);
    
    // 释放本地预览URL
    const removedFile = fileList.find(f => f.uid === uid);
    if (removedFile?.url && removedFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedFile.url);
    }
    
    // 通知父组件URL变更
    const urls = newFileList.map(f => f.url);
    onChange?.(urls);
  }, [fileList, onChange]);

  // 自定义上传处理
  const customUpload = useCallback(({ file }: { file: RcFile }) => {
    handleFileSelect(file);
  }, [handleFileSelect]);

  return (
    <div className="space-y-4">
      {/* 已上传的图片预览 */}
      {fileList.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {fileList.map((file) => (
            <div key={file.uid} className="relative group">
              <Image
                src={file.url}
                alt={file.name}
                className="w-full h-20 object-cover rounded-lg border"
                preview={{
                  mask: <div className="text-white text-xs">预览</div>,
                }}
              />
              {!disabled && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  className="absolute top-1 right-1 bg-red-500 bg-opacity-70 text-white hover:bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(file.uid)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {!disabled && fileList.length < maxCount && (
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={customUpload}
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            className="w-full"
          >
            {uploading ? '上传中...' : `上传图片 (${fileList.length}/${maxCount})`}
          </Button>
        </Upload>
      )}

      {/* 提示信息 */}
      <div className="text-xs text-gray-500">
        <div>• 支持 JPG、PNG、GIF、WebP 格式</div>
        <div>• 单张图片大小不超过 5MB</div>
        <div>• 最多上传 {maxCount} 张图片</div>
      </div>
    </div>
  );
};