import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppLoggerService } from '../../shared/services/logger.service';
import { MessageFeedbackType } from '../../types/feedback';

type TagKind = 'helpful' | 'notHelpful';

interface TagConfigEntry {
  path: string;
  cache: string[];
  watcher?: fs.FSWatcher;
}

const DEFAULT_HELPFUL_TAGS = [
  '准确详细',
  '切中要害',
  '资料丰富',
  '举一反三',
  '逻辑清晰',
];

const DEFAULT_NOT_HELPFUL_TAGS = [
  '事实错误',
  '信息不完整',
  '无关回答',
  '知识源问题',
  '理解错误',
  '响应速度',
  '格式问题',
];

@Injectable()
export class FeedbackConfigService {
  private readonly logger = new AppLoggerService();
  private readonly entries: Record<TagKind, TagConfigEntry>;

  constructor() {
    this.logger.setContext(FeedbackConfigService.name);
    this.entries = {
      helpful: {
        path: this.resolvePath('FEEDBACK_TAGS_HELPFUL_PATH', 'feedback_tags_helpful.txt'),
        cache: DEFAULT_HELPFUL_TAGS,
      },
      notHelpful: {
        path: this.resolvePath('FEEDBACK_TAGS_NOT_HELPFUL_PATH', 'feedback_tags_not_helpful.txt'),
        cache: DEFAULT_NOT_HELPFUL_TAGS,
      },
    };

    this.loadAll();
    this.setupWatchers();
  }

  getTags(feedbackType: MessageFeedbackType): string[] {
    switch (feedbackType) {
      case MessageFeedbackType.Helpful:
        return this.entries.helpful.cache;
      case MessageFeedbackType.NotHelpful:
      case MessageFeedbackType.PartiallyHelpful:
        return this.entries.notHelpful.cache;
      default:
        return this.entries.helpful.cache;
    }
  }

  getHelpfulTags(): string[] {
    return this.entries.helpful.cache;
  }

  getNotHelpfulTags(): string[] {
    return this.entries.notHelpful.cache;
  }

  private resolvePath(envKey: string, filename: string): string {
    const envValue = process.env[envKey];
    if (envValue && fs.existsSync(envValue)) {
      this.logger.log(`使用环境变量 ${envKey}: ${envValue}`);
      return envValue;
    }

    const candidates = [
      path.resolve(process.cwd(), 'config', filename),
      path.resolve(process.cwd(), 'backend', 'config', filename),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return candidates[0];
  }

  private loadAll() {
    (Object.keys(this.entries) as TagKind[]).forEach((kind) => this.loadTags(kind));
  }

  private loadTags(kind: TagKind) {
    const entry = this.entries[kind];
    try {
      const content = fs.readFileSync(entry.path, 'utf-8');
      const tags = content
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (tags.length === 0) {
        this.logger.warn(`反馈标签文件为空，使用内置默认值: ${entry.path}`);
        entry.cache = kind === 'helpful' ? DEFAULT_HELPFUL_TAGS : DEFAULT_NOT_HELPFUL_TAGS;
      } else {
        entry.cache = tags;
        this.logger.log(`反馈标签已加载 (${kind}), 共 ${tags.length} 条，路径: ${entry.path}`);
      }
    } catch (error) {
      entry.cache = kind === 'helpful' ? DEFAULT_HELPFUL_TAGS : DEFAULT_NOT_HELPFUL_TAGS;
      this.logger.warn(
        `读取反馈标签文件失败 (${kind})，使用默认列表。路径: ${entry.path}`,
      );
    }
  }

  private setupWatchers() {
    (Object.keys(this.entries) as TagKind[]).forEach((kind) => {
      const entry = this.entries[kind];
      const filePath = entry.path;
      if (!fs.existsSync(filePath)) {
        return;
      }

      try {
        const watcher = fs.watch(filePath, { persistent: true }, () => {
          this.logger.log(`检测到反馈标签文件变更 (${kind})，重新加载...`);
          this.loadTags(kind);
        });
        entry.watcher = watcher;
      } catch (error) {
        this.logger.warn(`反馈标签文件监听失败 (${kind}): ${filePath}`);
      }
    });
  }
}
