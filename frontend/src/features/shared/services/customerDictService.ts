import { apiGet, showApiError } from './api';

export interface CustomerDictItem {
  customerId: string;
  customerName: string;
  pyCode: string;
}

export interface CustomerDictResponse {
  customers: CustomerDictItem[];
}

/**
 * 获取所有客户字典（不分页，用于选择器）
 */
export const getAllCustomerDict = async (): Promise<CustomerDictResponse> => {
  try {
    const response = await apiGet<CustomerDictResponse>('/api/customer-dict/all');
    return response;
  } catch (error) {
    console.error('获取客户字典失败:', error);
    showApiError(error, '加载客户列表失败');
    throw error;
  }
};