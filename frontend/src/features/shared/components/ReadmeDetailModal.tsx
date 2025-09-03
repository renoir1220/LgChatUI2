import React from 'react';
import { Modal } from 'antd';
import type { ReadmeEntity } from '@types';

interface ReadmeDetailModalProps {
  /** README数据 */
  readme: ReadmeEntity | null;
  /** 是否显示模态框 */
  visible: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 模态框位置 */
  position?: { x: number; y: number };
}

/**
 * README详情展示模态框组件
 * 
 * 特性：
 * - 结构化展示README配置信息
 * - 支持鼠标位置定位
 * - 无动画快速显示
 * - 响应式布局设计
 */
export const ReadmeDetailModal: React.FC<ReadmeDetailModalProps> = ({
  readme,
  visible,
  onClose,
  position
}) => {
  if (!readme) return null;

  // 计算模态框位置
  const getModalStyle = (): React.CSSProperties => {
    if (!position) {
      return {};
    }

    const modalWidth = 650;
    const modalHeight = 400;
    let left = position.x - modalWidth / 2;
    let top = position.y - modalHeight / 2;
    
    // 边界检查
    if (left < 20) left = 20;
    if (left + modalWidth > window.innerWidth - 20) left = window.innerWidth - modalWidth - 20;
    if (top < 20) top = 20;
    if (top + modalHeight > window.innerHeight - 20) top = window.innerHeight - modalHeight - 20;

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      margin: 0,
      maxWidth: 'none'
    };
  };

  return (
    <Modal
      title="README配置详情"
      open={visible}
      onCancel={onClose}
      width={650}
      footer={null}
      className="readme-detail-modal"
      style={getModalStyle()}
      mask={false} // 移除遮罩层
      transitionName="" // 移除动画
      maskTransitionName="" // 移除遮罩动画
    >
      <div className="readme-content space-y-4">
        {/* 功能说明 */}
        <div className="readme-section">
          <h4 className="text-base font-semibold text-gray-800 mb-2">功能说明</h4>
          <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
            {readme.title}
          </p>
        </div>
        
        {/* 基本信息网格 */}
        <div className="grid grid-cols-2 gap-4">
          {readme.siteType && (
            <div className="readme-field">
              <span className="text-sm font-medium text-gray-600">站点类型:</span>
              <span className="ml-2 text-sm text-gray-800">{readme.siteType}</span>
            </div>
          )}
          {readme.moduleName && (
            <div className="readme-field">
              <span className="text-sm font-medium text-gray-600">模块名称:</span>
              <span className="ml-2 text-sm text-gray-800">{readme.moduleName}</span>
            </div>
          )}
          {/* 按需求显示“用户 - customer_name” */}
          {(readme.customerName !== undefined && readme.customerName !== null) && (
            <div className="readme-field">
              <span className="text-sm font-medium text-gray-600">用户:</span>
              <span className="ml-2 text-sm text-gray-800">{readme.customerName}</span>
            </div>
          )}
          {readme.version && (
            <div className="readme-field">
              <span className="text-sm font-medium text-gray-600">版本:</span>
              <span className="ml-2 text-sm text-gray-800">
                {readme.version}
                {readme.versionDate && (
                  <span className="text-gray-500 ml-1">
                    ({new Date(readme.versionDate).toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* 参数 - switch：始终展示；缺省时显示“无” */}
        {(() => {
          const val = readme.switch ?? '';
          const text = typeof val === 'string' ? (val.trim() ? val : '无') : '无';
          return (
            <div className="readme-section">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">参数</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <code className="text-sm text-gray-700 whitespace-pre-wrap block">
                  {text}
                </code>
              </div>
            </div>
          );
        })()}

        {/* SQL：始终展示；缺省时显示“无” */}
        {(() => {
          const val = readme.sql ?? '';
          const text = typeof val === 'string' ? (val.trim() ? val : '无') : '无';
          return (
            <div className="readme-section">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">SQL</h4>
              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <code className="text-sm text-gray-800 whitespace-pre-wrap font-mono block">
                  {text}
                </code>
              </div>
            </div>
          );
        })()}

        {/* 其他信息 */}
        {(readme.createTime || readme.seqNo) && (
          <div className="readme-section pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              {readme.createTime && (
                <span>
                  创建时间: {new Date(readme.createTime).toLocaleString()}
                </span>
              )}
              {readme.seqNo && (
                <span>序列号: {readme.seqNo}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReadmeDetailModal;
