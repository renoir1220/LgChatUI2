import React from 'react';
import { 
  FileSearchOutlined,
  ProjectOutlined,
  BulbOutlined,
  BugOutlined
} from '@ant-design/icons';

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

interface QuickActionsProps {
  /** 是否显示快捷操作栏 */
  visible: boolean;
  /** 点击快捷操作的回调 */
  onAction: (actionKey: string) => void;
}

/**
 * 快捷操作栏组件
 * 显示在输入框上方，提供常用功能的快速访问
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  visible,
  onAction,
}) => {
  const actions: QuickAction[] = [
    {
      key: 'readme-query',
      label: 'readme查询',
      icon: <FileSearchOutlined style={{ fontSize: 14, color: '#666' }} />,
      color: '#666'
    },
    {
      key: 'requirement-progress',
      label: '需求进展',
      icon: <ProjectOutlined style={{ fontSize: 14, color: '#666' }} />,
      color: '#666'
    },
    {
      key: 'suggestion',
      label: '提建议',
      icon: <BulbOutlined style={{ fontSize: 14, color: '#f5a623' }} />,
      color: '#f5a623'
    },
    {
      key: 'bug-report',
      label: '提BUG',
      icon: <BugOutlined style={{ fontSize: 14, color: '#ff4d4f' }} />,
      color: '#ff4d4f'
    },
  ];

  if (!visible) {
    return null;
  }

  return (
    <div className="quick-actions-bar" style={{
      padding: '6px 0 10px 0',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'flex-start',
      // 提升层级，避免被输入区辉光覆盖
      position: 'relative',
      zIndex: 10,
    }}>
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => onAction(action.key)}
          className="quick-action-btn"
          style={{
            padding: '4px 8px',
            border: '1px solid #e1e4e8',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: action.color || '#666',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: action.color && action.color !== '#666' ? 500 : 'normal'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            const hoverColor = action.color && action.color !== '#666' ? action.color : '#1677ff';
            target.style.opacity = '0.8';
            target.style.borderColor = hoverColor;
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            target.style.opacity = '1';
            target.style.borderColor = '#e1e4e8';
          }}
        >
          {action.icon}
          <span style={{ color: action.color }}>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
