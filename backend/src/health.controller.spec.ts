import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DatabaseService } from './shared/database/database.service';

describe('HealthController (unit)', () => {
  it('returns ok: true when DB query succeeds', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: { query: jest.fn().mockResolvedValue([{ ok: 1 }]) },
        },
      ],
    }).compile();

    const controller = module.get<HealthController>(HealthController);
    await expect(controller.dbHealth()).resolves.toEqual({ ok: true });
  });

  it('returns ok: false when DB query throws', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: { query: jest.fn().mockRejectedValue(new Error('boom')) },
        },
      ],
    }).compile();

    const controller = module.get<HealthController>(HealthController);
    await expect(controller.dbHealth()).resolves.toEqual({
      ok: false,
      error: 'boom',
    });
  });
});
