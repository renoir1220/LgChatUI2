import { AppLoggerService } from './logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new AppLoggerService();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('应该正确格式化日志消息', () => {
    service.setContext('TestContext');
    service.log('Test message', { requestId: 'test-123' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"INFO"'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"context":"TestContext"'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test message"'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"requestId":"test-123"'),
    );
  });

  it('应该正确处理HTTP请求日志', () => {
    const mockRequest = {
      method: 'GET',
      url: '/test',
      headers: { 'x-request-id': 'req-123' },
      ip: '127.0.0.1',
    };

    const mockResponse = {
      statusCode: 200,
    };

    service.logHttpRequest(mockRequest, mockResponse, 150);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"method":"GET"'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"statusCode":200'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"duration":"150ms"'),
    );
  });
});
