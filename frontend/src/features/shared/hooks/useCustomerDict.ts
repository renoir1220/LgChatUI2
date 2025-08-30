import { useState, useEffect, useCallback } from 'react';
import { getAllCustomerDict } from '../services/customerDictService';
import { CustomerCache } from '../utils/customerCache';
import type { CustomerDictItem } from '../services/customerDictService';

interface UseCustomerDictReturn {
  dictionaries: CustomerDictItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cacheInfo: {
    exists: boolean;
    remainingTime: number;
    total: number;
  };
  clearCache: () => void;
}

/**
 * 客户字典数据管理Hook
 * 支持本地缓存和智能刷新机制
 */
export const useCustomerDict = (): UseCustomerDictReturn => {
  const [dictionaries, setDictionaries] = useState<CustomerDictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDictionaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllCustomerDict();
      setDictionaries(response.customers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取客户字典失败';
      setError(errorMessage);
      console.error('获取客户字典失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    CustomerCache.clearCache();
    // 清除缓存后重新获取数据
    fetchDictionaries();
  }, [fetchDictionaries]);

  const getCacheInfo = useCallback(() => {
    const info = CustomerCache.getCacheInfo();
    return {
      exists: info.exists,
      remainingTime: info.remainingTime,
      total: info.total,
    };
  }, []);

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  return {
    dictionaries,
    loading,
    error,
    refetch: fetchDictionaries,
    cacheInfo: getCacheInfo(),
    clearCache,
  };
};