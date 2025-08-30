import type { CustomerDictItem } from '../services/customerDictService';

/**
 * 客户缓存数据结构
 */
interface CustomerCacheData {
  /** 客户列表 */
  customers: CustomerDictItem[];
  /** 客户总数（用于检查数据变化） */
  total: number;
  /** 缓存时间戳 */
  timestamp: number;
  /** 缓存版本号（用于强制刷新） */
  version: number;
}

/**
 * 客户字典本地缓存管理
 * 实现24小时过期和智能刷新机制
 */
export class CustomerCache {
  private static readonly CACHE_KEY = 'customer_dict_cache';
  private static readonly CACHE_VERSION = 1; // 可用于强制刷新缓存
  private static readonly CACHE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 获取缓存的客户数据
   * @returns 缓存数据或null（如果无效或过期）
   */
  static getCachedCustomers(): CustomerCacheData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return null;
      }

      const data: CustomerCacheData = JSON.parse(cached);
      
      // 检查版本号
      if (data.version !== this.CACHE_VERSION) {
        this.clearCache();
        return null;
      }

      // 检查过期时间
      const now = Date.now();
      if (now - data.timestamp > this.CACHE_EXPIRE_TIME) {
        this.clearCache();
        return null;
      }

      // 数据有效性检查
      if (!data.customers || !Array.isArray(data.customers) || data.total < 0) {
        this.clearCache();
        return null;
      }

      return data;
    } catch (error) {
      console.error('读取客户缓存失败:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * 保存客户数据到缓存
   * @param customers 客户列表
   * @param total 总数
   */
  static setCachedCustomers(customers: CustomerDictItem[], total: number): void {
    try {
      const cacheData: CustomerCacheData = {
        customers,
        total,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存客户缓存失败:', error);
      // localStorage 满了或其他错误，清空缓存
      this.clearCache();
    }
  }

  /**
   * 检查缓存是否需要刷新
   * @param currentTotal 服务端返回的当前总数
   * @returns 是否需要刷新
   */
  static shouldRefreshCache(currentTotal: number): boolean {
    const cached = this.getCachedCustomers();
    if (!cached) {
      return true; // 没有缓存，需要刷新
    }

    // 总数不匹配，说明数据有变化
    if (cached.total !== currentTotal) {
      return true;
    }

    return false;
  }

  /**
   * 获取缓存的剩余有效时间（毫秒）
   */
  static getCacheRemainingTime(): number {
    const cached = this.getCachedCustomers();
    if (!cached) {
      return 0;
    }

    const elapsed = Date.now() - cached.timestamp;
    const remaining = this.CACHE_EXPIRE_TIME - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('清除客户缓存失败:', error);
    }
  }

  /**
   * 获取缓存信息（用于调试）
   */
  static getCacheInfo(): {
    exists: boolean;
    size: number;
    remainingTime: number;
    total: number;
  } {
    const cached = this.getCachedCustomers();
    const cacheString = localStorage.getItem(this.CACHE_KEY) || '';
    
    return {
      exists: !!cached,
      size: new Blob([cacheString]).size, // 缓存大小（字节）
      remainingTime: this.getCacheRemainingTime(),
      total: cached?.total || 0,
    };
  }
}