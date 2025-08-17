import { useEffect, useState } from 'react';
import { apiGet } from '../../shared/services/api';

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
        if (list.length && !currentKnowledgeBase) setCurrentKnowledgeBase(list[0].id);
      } catch (e) {
        // 后端暂未实现时，保持空列表，不阻塞聊天功能
        if (!mounted) return;
        setKnowledgeBases([]);
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchKB();
    return () => { mounted = false; };
  }, [currentKnowledgeBase]);

  return {
    knowledgeBases,
    currentKnowledgeBase,
    setCurrentKnowledgeBase,
    loading,
    error,
  } as const;
}