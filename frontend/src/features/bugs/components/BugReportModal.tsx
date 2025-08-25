import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Divider,
} from 'antd';
import { BugOutlined } from '@ant-design/icons';
import type { CreateBugRequest, BugPriority } from "@types";
import { BugPriority as BugPriorityEnum, BugPriorityLabels } from "@types";
import { ImageUpload } from './ImageUpload';
import { bugService } from '../services/bugService';

interface BugReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const { TextArea } = Input;
const { Option } = Select;

/**
 * BUG提交模态框
 * 包含标题、描述、优先级选择和图片上传功能
 */
export const BugReportModal: React.FC<BugReportModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 提交BUG
  const handleSubmit = async (values: {
    title: string;
    content: string;
    priority: BugPriority;
    images: string[];
  }) => {
    setSubmitting(true);
    try {
      const bugData: CreateBugRequest = {
        title: values.title.trim(),
        content: values.content.trim(),
        priority: values.priority,
        images: values.images || [],
      };

      await bugService.createBug(bugData);
      
      message.success('BUG提交成功！我们会尽快处理。');
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Submit bug error:', error);
      message.error(error instanceof Error ? error.message : 'BUG提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 取消提交
  const handleCancel = () => {
    if (submitting) {
      return;
    }
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BugOutlined className="text-red-500" />
          <span>提交BUG反馈</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
      centered
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: BugPriorityEnum.MEDIUM,
          images: [],
        }}
      >
        <Form.Item
          name="title"
          label="BUG标题"
          rules={[
            { required: true, message: '请输入BUG标题' },
            { max: 200, message: '标题不能超过200字符' }
          ]}
        >
          <Input
            placeholder="请简要描述遇到的问题"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="详细描述"
          rules={[
            { required: true, message: '请详细描述BUG' },
            { max: 2000, message: '描述不能超过2000字符' }
          ]}
        >
          <TextArea
            placeholder="请详细描述BUG的现象、复现步骤、期望结果等信息..."
            rows={6}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select placeholder="选择BUG优先级">
            {Object.values(BugPriorityEnum)
              .filter((value): value is BugPriority => typeof value === 'number')
              .map((priority) => (
                <Option key={priority} value={priority}>
                  <span
                    className={
                      priority === BugPriorityEnum.CRITICAL
                        ? 'text-red-600 font-medium'
                        : priority === BugPriorityEnum.HIGH
                        ? 'text-orange-500 font-medium'
                        : priority === BugPriorityEnum.MEDIUM
                        ? 'text-blue-500'
                        : 'text-gray-500'
                    }
                  >
                    {BugPriorityLabels[priority]}
                  </span>
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Divider orientation="left">相关截图（可选）</Divider>

        <Form.Item name="images" label="上传图片">
          <ImageUpload maxCount={5} />
        </Form.Item>


        <div className="flex justify-end gap-3">
          <Button onClick={handleCancel} disabled={submitting}>
            取消
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<BugOutlined />}
          >
            {submitting ? '提交中...' : '提交BUG'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};