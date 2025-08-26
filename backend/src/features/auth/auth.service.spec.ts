import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersRepository } from './repositories/users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findByUsername: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  it('应该成功创建服务', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('应该成功登录并返回token', async () => {
      const mockUser = {
        id: 'user_test',
        username: 'test',
        displayName: 'Test User',
        createdAt: '2023-01-01T00:00:00.000Z',
      };

      usersRepository.findByUsername.mockResolvedValue(mockUser);
      const signSpy = jest.spyOn(jwtService, 'sign');
      signSpy.mockReturnValue('test-jwt-token');

      const result = await service.login({ username: 'test' });

      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          id: 'user_test',
          username: 'test',
          displayName: 'Test User',
          roles: [],
        },
      });

      expect(signSpy).toHaveBeenCalledWith({
        sub: 'user_test',
        username: 'test',
      });
    });

    it('应该在用户不存在时抛出异常', async () => {
      usersRepository.findByUsername.mockResolvedValue(null);

      await expect(service.login({ username: 'nonexistent' })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login({ username: 'nonexistent' })).rejects.toThrow(
        '用户名不存在，请使用有效的员工姓名',
      );
    });
  });

  describe('validateUser', () => {
    it('应该返回用户信息如果用户存在', async () => {
      const mockUser = {
        id: 'user_test',
        username: 'test',
        displayName: 'Test User',
        createdAt: '2023-01-01T00:00:00.000Z',
      };

      usersRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('test');

      expect(result).toEqual(mockUser);
    });

    it('应该在用户不存在时返回null', async () => {
      usersRepository.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');

      expect(result).toBeNull();
    });

    it('应该在发生错误时返回null', async () => {
      usersRepository.findByUsername.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.validateUser('test');

      expect(result).toBeNull();
    });
  });
});
