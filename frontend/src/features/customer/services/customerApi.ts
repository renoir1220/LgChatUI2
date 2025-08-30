import { apiGet } from '../../shared/services/api';
import type { CrmSitesResponse } from '../types';

export const customerApi = {
  /**
   * 根据客户ID获取站点列表
   * @param customerId 客户ID
   */
  getSitesByCustomerId: async (customerId: string): Promise<CrmSitesResponse> => {
    return apiGet(`/api/crm-customer/sites/${customerId}`);
  },

  /**
   * 根据客户名称获取站点列表
   * @param customerName 客户名称
   */
  getSitesByCustomerName: async (customerName: string): Promise<CrmSitesResponse> => {
    return apiGet(`/api/crm-customer/sites-by-name/${encodeURIComponent(customerName)}`);
  },
};