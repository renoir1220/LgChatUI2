import { Injectable } from '@nestjs/common';
import { CustomerDictItem, CustomerDictSelectorResponse } from '../../types';
import { CrmDatabaseService } from '../../shared/database/database.service';

@Injectable()
export class CustomerDictRepository {
  constructor(private readonly db: CrmDatabaseService) {}

  /**
   * 查询客户字典列表
   * @param keyword 搜索关键词（可选）
   * @param page 页码
   * @param pageSize 每页数量
   */
  async findCustomers(
    keyword?: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ customers: CustomerDictItem[]; total: number }> {
    try {
      // 构建WHERE条件
      const whereConditions: string[] = [];
      const params: string[] = [];
      let paramIndex = 0;

      if (keyword && keyword.trim()) {
        whereConditions.push(`
          (c.NAME LIKE @p${paramIndex} 
           OR c.PYCODE LIKE @p${paramIndex + 1})
        `);
        const searchTerm = `%${keyword.trim()}%`;
        params.push(searchTerm, searchTerm);
        paramIndex += 2;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM BASE_CUSTOMER c
        ${whereClause}
      `;

      const countResult = await this.db.queryWithErrorHandling<{ total: number }>(
        countQuery,
        params,
        '查询客户总数'
      );
      const total = countResult[0]?.total || 0;

      // 查询分页数据
      const offset = (page - 1) * pageSize;
      
      const dataQuery = `
        SELECT c.NAME, c.PYCODE, c.CUSTOMER_ID
        FROM BASE_CUSTOMER c
        ${whereClause}
        ORDER BY c.NAME
        OFFSET ${offset} ROWS
        FETCH NEXT ${pageSize} ROWS ONLY
      `;

      const rows = await this.db.queryWithErrorHandling<{
        NAME: string;
        PYCODE: string;
        CUSTOMER_ID: string;
      }>(dataQuery, params, '查询客户数据');

      // 转换为前端需要的格式
      const customers: CustomerDictItem[] = rows.map((row) => ({
        customerId: row.CUSTOMER_ID,
        customerName: row.NAME,
        pyCode: row.PYCODE || '',
      }));

      return { customers, total };
    } catch (error) {
      throw new Error(`查询客户字典失败: ${error.message}`);
    }
  }

  /**
   * 获取客户字典（用于选择器，支持搜索和分页）
   * @param keyword 搜索关键词（可选）
   * @param page 页码（默认1）
   * @param pageSize 每页数量（默认20，适合选择器）
   */
  async findAllCustomers(
    keyword?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<CustomerDictSelectorResponse> {
    try {
      // 复用已有的 findCustomers 方法逻辑
      const result = await this.findCustomers(keyword, page, pageSize);
      
      // 计算是否还有更多数据
      const hasMore = page * pageSize < result.total;
      
      return {
        customers: result.customers,
        total: result.total,
        hasMore,
      };
    } catch (error) {
      throw new Error(`查询选择器客户字典失败: ${error.message}`);
    }
  }

  /**
   * 获取所有客户字典（不分页，用于本地缓存）
   * 仅返回基本信息以减少内存占用
   */
  async findAllCustomersForCache(): Promise<{ customers: CustomerDictItem[]; total: number }> {
    try {
      const dataQuery = `
        SELECT c.NAME, c.PYCODE, c.CUSTOMER_ID
        FROM BASE_CUSTOMER c
        ORDER BY c.NAME
      `;

      const rows = await this.db.queryWithErrorHandling<{
        NAME: string;
        PYCODE: string;
        CUSTOMER_ID: string;
      }>(dataQuery, [], '查询全量客户数据');

      // 转换为前端需要的格式
      const customers: CustomerDictItem[] = rows.map((row) => ({
        customerId: row.CUSTOMER_ID,
        customerName: row.NAME,
        pyCode: row.PYCODE || '',
      }));

      return { customers, total: customers.length };
    } catch (error) {
      throw new Error(`查询全量客户字典失败: ${error.message}`);
    }
  }
}
