import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status without exposing sensitive environment or database credentials', () => {
    const health = controller.getHealth();
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('uptime');
    expect(typeof health.uptime).toBe('number');
    expect(health).toHaveProperty('timestamp');
    expect(health).not.toHaveProperty('database');
    expect(health).not.toHaveProperty('env');
    expect(health).not.toHaveProperty('supabaseKey');
  });
});
