import { useState, useEffect } from 'react';
import { customerApi } from '../services/customerApi';
import type { CrmSite, SiteSummary, InstallGroup } from '../types';

export const useSites = (customerId?: string, customerName?: string) => {
  const [sites, setSites] = useState<CrmSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    if (!customerId && !customerName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (customerId) {
        response = await customerApi.getSitesByCustomerId(customerId);
      } else if (customerName) {
        response = await customerApi.getSitesByCustomerName(customerName);
      }
      
      if (response) {
        setSites(response.sites);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取站点信息失败');
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [customerId, customerName]);

  // 计算汇总数据
  const summaryData: SiteSummary[] = sites.reduce((acc, site) => {
    const key = `${site.productSubcategory}-${site.siteName}`;
    const existing = acc.find(item => 
      item.productSubcategory === site.productSubcategory && 
      item.siteName === site.siteName
    );
    
    if (existing) {
      existing.totalQuantity += site.quantity;
    } else {
      acc.push({
        productSubcategory: site.productSubcategory,
        siteName: site.siteName,
        totalQuantity: site.quantity,
      });
    }
    
    return acc;
  }, [] as SiteSummary[]).sort((a, b) => {
    // 按产品小类、站点名称排序
    if (a.productSubcategory !== b.productSubcategory) {
      return a.productSubcategory.localeCompare(b.productSubcategory);
    }
    return a.siteName.localeCompare(b.siteName);
  });

  // 计算按装机单分组数据
  const installGroups: InstallGroup[] = sites.reduce((acc, site) => {
    const existing = acc.find(group => group.installCode === site.installCode);
    
    if (existing) {
      existing.sites.push(site);
    } else {
      acc.push({
        installCode: site.installCode,
        projectSummary: site.projectSummary,
        documentStatus: site.documentStatus,
        createTime: (site as any).createTime ?? (site as any).create_time ?? null,
        completeDate: site.completeDate,
        acceptanceDate: site.acceptanceDate,
        sites: [site],
      });
    }
    
    return acc;
  }, [] as InstallGroup[])
    .map(group => ({
      ...group,
      // 对每个组内的站点按产品小类、站点名称排序
      sites: group.sites.sort((a, b) => {
        if (a.productSubcategory !== b.productSubcategory) {
          return a.productSubcategory.localeCompare(b.productSubcategory);
        }
        return a.siteName.localeCompare(b.siteName);
      })
    }))
    .sort((a, b) => {
      // 按申请时间由近到远排序（最新的在前面）
      const aTime = a.createTime ? new Date(a.createTime).getTime() : 0;
      const bTime = b.createTime ? new Date(b.createTime).getTime() : 0;
      
      // 如果时间相同或都为空，则按装机单号倒序作为次要排序
      if (aTime === bTime) {
        return b.installCode.localeCompare(a.installCode);
      }
      
      return bTime - aTime; // 时间倒序，最新的在前
    });

  return {
    sites,
    summaryData,
    installGroups,
    loading,
    error,
    refetch: fetchSites,
  };
};
