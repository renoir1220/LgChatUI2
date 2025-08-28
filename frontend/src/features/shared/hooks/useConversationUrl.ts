import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isValidUUID } from '../utils/uuid';

// 统一会话ID与 URL 参数 ?c= 的同步
export function useConversationUrl() {
  const [params, setParams] = useSearchParams();

  const conversationFromUrl = useMemo(() => {
    const c = params.get('c') || undefined;
    return isValidUUID(c) ? (c as string) : undefined;
  }, [params]);

  const setConversationInUrl = (id?: string) => {
    const next = new URLSearchParams(params);
    if (id && isValidUUID(id)) {
      next.set('c', id);
    } else {
      next.delete('c');
    }
    setParams(next, { replace: true });
  };

  return { conversationFromUrl, setConversationInUrl };
}

