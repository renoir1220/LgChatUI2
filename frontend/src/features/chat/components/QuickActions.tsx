import React, { useState, useEffect } from 'react';
import { 
  FileSearchOutlined,
  ProjectOutlined,
  BulbOutlined,
  BugOutlined,
  BuildOutlined
} from '@ant-design/icons';
import { QUICK_ACTIONS } from '../constants';

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
export const QuickActions: React.FC<QuickActionsProps> = ({ visible, onAction }) => {
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!visible) {
    return null;
  }

  // 过滤要显示的操作 - 在移动端隐藏"提BUG"按钮
  const visibleActions = QUICK_ACTIONS.filter(action => {
    if (isMobile && action.key === 'bug-report') {
      return false;
    }
    return true;
  });

  return (
    <div className="quick-actions-bar" style={{
      padding: '6px 0 10px 0',
      display: 'flex',
      gap: isMobile ? '8px' : '12px',
      alignItems: 'center',
      justifyContent: 'flex-start',
      // 提升层级，避免被输入区辉光覆盖
      position: 'relative',
      zIndex: 10,
      flexWrap: 'wrap', // 允许换行
    }}>
      {visibleActions.map((action) => {
        const icon = action.key === 'readme-query'
          ? <FileSearchOutlined style={{ fontSize: 14, color: action.color || '#666' }} />
          : action.key === 'requirement-progress'
            ? <ProjectOutlined style={{ fontSize: 14, color: action.color || '#666' }} />
            : action.key === 'customer-sites'
              ? <BuildOutlined style={{ fontSize: 14, color: action.color || '#666' }} />
              : action.key === 'suggestion'
                ? <BulbOutlined style={{ fontSize: 14, color: action.color || '#666' }} />
                : <BugOutlined style={{ fontSize: 14, color: action.color || '#666' }} />;
        return (
        <button
          key={action.key}
          onClick={() => onAction(action.key)}
          className="quick-action-btn"
          style={{
            padding: isMobile ? '4px 6px' : '4px 8px',
            border: '1px solid #e1e4e8',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: action.color || '#666',
            fontSize: isMobile ? '11px' : '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0px' : '6px', // 移动端不需要间距，因为没有图标
            fontWeight: action.color && action.color !== '#666' ? 500 : 'normal',
            whiteSpace: 'nowrap' as const // 防止文字换行
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
          {!isMobile && icon}
          <span style={{ color: action.color }}>{action.label}</span>
        </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
