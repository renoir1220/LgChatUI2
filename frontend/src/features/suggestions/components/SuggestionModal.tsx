import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Form } from 'antd';
import { BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import { suggestionsApi } from '../api/suggestions-api';
import type { CreateSuggestionRequest } from '@lg/shared';

const { TextArea } = Input;

export interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // 当模态框打开时，自动聚焦到标题输入框
  useEffect(() => {
    if (isOpen) {
      // 延迟一下确保Modal完全渲染
      const timer = setTimeout(() => {
        const titleInput = document.querySelector('.suggestion-title-input input') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const suggestionData: CreateSuggestionRequest = {
        title: values.title,
        content: values.content,
      };

      await suggestionsApi.createSuggestion(suggestionData);
      
      message.success('建议提交成功！感谢您的反馈');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('提交建议失败:', error);
      message.error('建议提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined style={{ color: '#1890ff' }} />
          提建议
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      width={500}
      destroyOnHidden
      centered
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isSubmitting}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          icon={isSubmitting ? <LoadingOutlined /> : null}
        >
          {isSubmitting ? '提交中...' : '提交建议'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="建议标题"
          rules={[
            { required: true, message: '请输入建议标题' },
            { max: 100, message: '标题不能超过100字符' }
          ]}
        >
          <Input
            className="suggestion-title-input"
            placeholder="请简要描述您的建议..."
            autoFocus
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="详细内容"
          rules={[
            { required: true, message: '请输入建议的详细内容' },
            { max: 1000, message: '内容不能超过1000字符' }
          ]}
        >
          <TextArea
            placeholder="请详细描述您的建议，包括遇到的问题、期望的功能或改进建议等..."
            rows={6}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f6f8fa', 
          borderRadius: 6, 
          fontSize: 12, 
          color: '#666',
          border: '1px solid #e1e4e8'
        }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>提交须知：</div>
          <div>• 我们会认真阅读每一条建议并及时回复</div>
          <div>• 建议将被记录并用于产品改进</div>
          <div>• 您可以在系统中查看建议的处理状态</div>
        </div>
      </Form>
    </Modal>
  );
};