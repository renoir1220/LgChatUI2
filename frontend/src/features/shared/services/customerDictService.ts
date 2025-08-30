import { apiGet, showApiError } from './api';
import { CustomerCache } from '../utils/customerCache';

export interface CustomerDictItem {
  customerId: string;
  customerName: string;
  pyCode: string;
}

export interface CustomerDictResponse {
  customers: CustomerDictItem[];
  total: number;
}

/**
 * 获取客户统计信息（客户总数）
 */
export const getCustomerStats = async (): Promise<{ totalCustomers: number }> => {
  try {
    const response = await apiGet<{ totalCustomers: number }>('/api/customer-dict/stats');
    return response;
  } catch (error) {
    console.error('获取客户统计信息失败:', error);
    throw error;
  }
};

/**
 * 获取全量客户字典（从服务端，用于缓存）
 */
export const getAllCustomersForCache = async (): Promise<CustomerDictResponse> => {
  try {
    const response = await apiGet<CustomerDictResponse>('/api/customer-dict/cache');
    return response;
  } catch (error) {
    console.error('获取全量客户字典失败:', error);
    showApiError(error, '加载客户列表失败');
    throw error;
  }
};

/**
 * 获取所有客户字典（优先使用缓存，支持智能刷新）
 */
export const getAllCustomerDict = async (): Promise<CustomerDictResponse> => {
  try {
    // 1. 先获取服务端统计信息
    const stats = await getCustomerStats();
    const currentTotal = stats.totalCustomers;

    // 2. 检查缓存是否有效且最新
    const cachedData = CustomerCache.getCachedCustomers();
    if (cachedData && !CustomerCache.shouldRefreshCache(currentTotal)) {
      // 使用缓存数据
      return {
        customers: cachedData.customers,
        total: cachedData.total,
      };
    }

    // 3. 缓存无效或数据有变化，从服务端获取全量数据
    const response = await getAllCustomersForCache();
    
    // 4. 更新缓存
    CustomerCache.setCachedCustomers(response.customers, response.total);

    return response;
  } catch (error) {
    // 如果网络请求失败，尝试使用过期缓存作为降级方案
    const cachedData = CustomerCache.getCachedCustomers();
    if (cachedData) {
      console.warn('使用过期缓存数据作为降级方案');
      return {
        customers: cachedData.customers,
        total: cachedData.total,
      };
    }

    console.error('获取客户字典失败:', error);
    showApiError(error, '加载客户列表失败');
    throw error;
  }
};