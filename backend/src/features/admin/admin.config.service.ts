import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppLoggerService } from '../../shared/services/logger.service';

@Injectable()
export class AdminConfigService {
  private readonly logger = new AppLoggerService();
  private adminSet = new Set<string>();
  private watching = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private resolvedPath: string;

  constructor() {
    this.resolvedPath = this.resolveConfigPath();
    this.logger.setContext('AdminConfigService');
    this.loadAdmins();
    this.setupWatch();
  }

  isAdmin(username?: string | null): boolean {
    if (!username) return false;
    return this.adminSet.has(username.trim());
  }

  getAdmins(): string[] {
    return Array.from(this.adminSet.values());
  }

  private resolveConfigPath(): string {
    const fromEnv = process.env.ADMIN_CONFIG_PATH;
    if (fromEnv && fs.existsSync(fromEnv)) {
      this.logger.log(`使用环境变量 ADMIN_CONFIG_PATH: ${fromEnv}`);
      return fromEnv;
    }
    // 常见运行目录：在 backend 下启动或在项目根启动
    const candidates = [
      path.resolve(process.cwd(), 'config/admins.txt'),
      path.resolve(process.cwd(), 'backend/config/admins.txt'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // 若不存在，也返回默认路径，首次加载会给出提示
    return candidates[0];
  }

  private loadAdmins() {
    try {
      const content = fs.readFileSync(this.resolvedPath, 'utf-8');
      const list = content
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      this.adminSet = new Set(list);
      this.logger.log(
        `管理员配置已加载，共 ${this.adminSet.size} 条，路径: ${this.resolvedPath}`,
      );
    } catch (e) {
      this.adminSet = new Set();
      this.logger.warn(
        `未能读取管理员配置文件（将视为无管理员）：${this.resolvedPath}. 可设置 ADMIN_CONFIG_PATH 或创建该文件。`,
      );
    }
  }

  private setupWatch() {
    if (this.watching) return;
    try {
      fs.watch(this.resolvedPath, { persistent: true }, (eventType) => {
        // 文件可能被编辑器替换，使用去抖动后重载
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.logger.log(`检测到管理员配置变化（${eventType}），重新加载...`);
          this.loadAdmins();
        }, 200);
      });
      this.watching = true;
      this.logger.log('管理员配置热加载已启用');
    } catch (e) {
      this.logger.warn('管理员配置热加载不可用（fs.watch失败）');
    }
  }
}
