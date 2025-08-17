/**
 * 后端 TypeScript 编码规范示例
 * 这些示例展示了正确的编码模式和最佳实践
 */

// ✅ 正确：使用具体类型
interface ChatRequest {
  message: string;
  conversationId?: string;
  knowledgeBaseId?: string;
}

// ✅ 正确：明确的错误处理
class ChatService {
  private readonly logger = new AppLoggerService();

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const result = await this.difyService.process(request);
      return result;
    } catch (error) {
      this.logger.error('处理失败', error instanceof Error ? error.stack : undefined, { 
        context: 'ChatService',
        requestId: request.conversationId 
      });
      throw new HttpException('处理失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

// ❌ 错误：避免使用any
const handleRequest = (data: any) => {
  console.log('handling request:', data);
};

// ✅ 正确：使用结构化日志
class ExampleController {
  private readonly logger = new AppLoggerService();

  constructor() {
    this.logger.setContext('ExampleController');
  }

  async handleAction(data: ActionRequest) {
    this.logger.log('开始处理操作', { 
      actionType: data.type,
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
    
    // 处理逻辑...
    
    this.logger.log('操作处理完成', { 
      actionType: data.type,
      duration: '120ms'
    });
  }
}

// ✅ 正确：错误处理最佳实践
export class DatabaseService {
  async findUser(username: string): Promise<User | null> {
    try {
      const result = await this.query('SELECT * FROM users WHERE username = ?', [username]);
      return result.length > 0 ? this.mapToUser(result[0]) : null;
    } catch (error) {
      this.logger.error('数据库查询失败', error instanceof Error ? error.stack : undefined, {
        operation: 'findUser',
        username: username // 注意：生产环境可能需要脱敏
      });
      throw new InternalServerErrorException('用户查询失败');
    }
  }

  private mapToUser(row: any): User {
    // 类型安全的数据映射
    return {
      id: String(row.id),
      username: String(row.username),
      displayName: String(row.display_name || row.username),
      roles: row.roles ? JSON.parse(row.roles) : []
    };
  }
}

// ✅ 正确：API响应类型定义
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// ✅ 正确：Guard 实现示例
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}