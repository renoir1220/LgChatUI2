import { useState, useEffect } from 'react';
import { getAllCustomerDict } from '../services/customerDictService';
import type { CustomerDictItem } from '../services/customerDictService';

interface UseCustomerDictReturn {
  dictionaries: CustomerDictItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 客户字典数据管理Hook
 */
export const useCustomerDict = (): UseCustomerDictReturn => {
  const [dictionaries, setDictionaries] = useState<CustomerDictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDictionaries = async () => {
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
  };

  useEffect(() => {
    fetchDictionaries();
  }, []);

  return {
    dictionaries,
    loading,
    error,
    refetch: fetchDictionaries,
  };
};