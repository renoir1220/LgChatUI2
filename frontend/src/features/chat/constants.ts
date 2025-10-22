// Chat 相关常量与映射，集中管理，避免硬编码散落

// 快捷操作 -> 默认目标知识库名 映射
export const QUICK_ACTION_KB_NAME_MAP: Record<string, string> = {
  'requirement-progress': '常见问题与需求',
};

// 常用知识库名称常量（如后续改为ID，可在此统一替换）
export const KB_NAME_REQUIREMENTS = '常见问题与需求';

// 快捷操作定义（统一来源）
export interface QuickActionDef {
  key: string;
  label: string;
  color?: string; // 仅作语义标注，UI 自行决定如何使用
}

export const QUICK_ACTIONS: QuickActionDef[] = [
  { key: 'readme-query', label: 'readme查询' },
  { key: 'requirement-progress', label: '需求进展' },
  { key: 'customer-sites', label: '客户站点查询' },
  { key: 'suggestion', label: '提建议', color: '#f5a623' },
  { key: 'bug-report', label: '提BUG', color: '#ff4d4f' },
];
