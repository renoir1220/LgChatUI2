import { Test, TestingModule } from '@nestjs/testing'
import { BugsController } from './bugs.controller'
import { BugsService } from './bugs.service'
import type { Bug, BugListResponse, BugPriority, BugStatus, CreateBugRequest, BugQuery } from '@lg/shared'

describe('BugsController (unit)', () => {
  let controller: BugsController
  let service: jest.Mocked<BugsService>

  const mockBug: Bug = {
    id: '11111111-1111-1111-1111-111111111111',
    title: '示例BUG',
    content: '页面崩溃',
    submitterName: '张三',
    assigneeId: null,
    assigneeName: null,
    priority: 1 as BugPriority,
    status: 0 as BugStatus,
    images: ['https://example.com/1.png'],
    developerReply: null,
    createdAt: '2025-08-21T00:00:00.000Z',
    updatedAt: '2025-08-21T00:00:00.000Z',
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BugsController],
      providers: [
        {
          provide: BugsService,
          useValue: {
            getBugs: jest.fn(),
            createBug: jest.fn(),
            getBugById: jest.fn(),
            updateBug: jest.fn(),
            deleteBug: jest.fn(),
            assignBug: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get(BugsController)
    service = module.get(BugsService) as jest.Mocked<BugsService>
  })

  it('GET /api/bugs 返回分页结果', async () => {
    const query: BugQuery = { page: 1, pageSize: 10 }
    const resp: BugListResponse = { bugs: [mockBug], total: 1, page: 1, pageSize: 10 }
    service.getBugs.mockResolvedValue(resp)

    const result = await controller.getBugs(query)
    expect(service.getBugs).toHaveBeenCalledWith(query)
    expect(result).toEqual(resp)
  })

  it('POST /api/bugs 使用请求中的用户名作为提交者', async () => {
    const req = { user: { username: '李四' } } as any
    const data: CreateBugRequest = {
      title: '无法登录',
      content: '点击登录无响应',
      priority: 2 as BugPriority,
      images: [],
    }
    service.createBug.mockResolvedValue({ ...mockBug, title: data.title, content: data.content, submitterName: '李四' })

    const result = await controller.createBug(data, req)
    expect(service.createBug).toHaveBeenCalledWith('李四', data)
    expect(result.submitterName).toBe('李四')
    expect(result.title).toBe('无法登录')
  })
})

