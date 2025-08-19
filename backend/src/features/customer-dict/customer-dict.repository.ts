import { Injectable } from '@nestjs/common';
import { CustomerDictItem } from '@lg/shared';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class CustomerDictRepository {
  constructor(private readonly db: DatabaseService) {}

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
      // 先用简单查询测试，不带搜索条件和参数化查询
      const countQuery = `
        SELECT COUNT(DISTINCT xq.customer_name) as total
        FROM BUS_XQ xq
        INNER JOIN BASE_CUSTOMER c ON xq.CUSTOMER_ID = c.CUSTOMER_ID
      `;

      const countResult = await this.db.query<{ total: number }>(countQuery);
      const total = countResult[0]?.total || 0;

      // 查询分页数据
      const offset = (page - 1) * pageSize;
      const dataQuery = `
        SELECT DISTINCT xq.customer_name, c.PYCODE
        FROM BUS_XQ xq
        INNER JOIN BASE_CUSTOMER c ON xq.CUSTOMER_ID = c.CUSTOMER_ID
        ORDER BY xq.customer_name
        OFFSET ${offset} ROWS
        FETCH NEXT ${pageSize} ROWS ONLY
      `;

      const rows = await this.db.query<{
        customer_name: string;
        PYCODE: string;
      }>(dataQuery);

      // 转换为前端需要的格式
      const customers: CustomerDictItem[] = rows.map((row) => ({
        customerName: row.customer_name,
        pyCode: row.PYCODE || '',
      }));

      return { customers, total };
    } catch (error) {
      throw new Error(`查询客户字典失败: ${error.message}`);
    }
  }

}