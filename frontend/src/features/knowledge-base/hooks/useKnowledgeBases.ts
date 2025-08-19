import { useEffect, useState } from 'react';
import { apiGet, showApiError } from '../../shared/services/api';

export interface KnowledgeBase {
  id: string;
  name: string;
}

export function useKnowledgeBases() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchKB() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<KnowledgeBase[]>(`/api/knowledge-bases`);
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setKnowledgeBases(list);
        // 只在初始化时设置默认知识库，避免覆盖用户选择
        if (list.length && currentKnowledgeBase === undefined) {
          setCurrentKnowledgeBase(list[0].id);
        }
      } catch (e) {
        // 后端暂未实现时，保持空列表，不阻塞聊天功能
        if (!mounted) return;
        setKnowledgeBases([]);
        const errorMessage = e instanceof Error ? e.message : '加载失败';
        setError(errorMessage);
        // 知识库加载失败不影响核心聊天功能，所以只在调试时显示错误
        if (process.env.NODE_ENV === 'development') {
          showApiError(e, '加载知识库列表失败');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchKB();
    return () => { mounted = false; };
  }, []); // 移除 currentKnowledgeBase 依赖，只在组件挂载时获取一次

  return {
    knowledgeBases,
    currentKnowledgeBase,
    setCurrentKnowledgeBase,
    loading,
    error,
  } as const;
}