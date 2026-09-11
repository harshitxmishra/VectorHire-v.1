import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsController } from '../src/jobs/jobs.controller';
import { JobsService } from '../src/jobs/jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let service: JobsService;

  const mockJob = {
    id: 1,
    created_at: '2026-09-11T10:00:00.000Z',
    updated_at: '2026-09-11T10:00:00.000Z',
    title: 'Senior AI Engineer',
    requirements: 'Strong background in LLMs, Python, TypeScript, and vector databases.',
  };

  const mockService = {
    findAll: vi.fn().mockResolvedValue([mockJob]),
    create: vi.fn().mockResolvedValue(mockJob),
    update: vi.fn().mockResolvedValue({ ...mockJob, title: 'Lead AI Engineer' }),
    remove: vi.fn().mockResolvedValue({ success: true, message: 'Job description 1 deleted.' }),
  };

  beforeEach(() => {
    service = mockService as unknown as JobsService;
    controller = new JobsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all job descriptions (GET /api/v1/jobs)', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockJob]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should create job description (POST /api/v1/jobs)', async () => {
    const dto = {
      title: 'Senior AI Engineer',
      requirements: 'Strong background in LLMs, Python, TypeScript, and vector databases.',
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockJob);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should update job description (PUT /api/v1/jobs/:id)', async () => {
    const dto = {
      title: 'Lead AI Engineer',
      requirements: 'Strong background in LLMs, Python, TypeScript, and vector databases.',
    };
    const result = await controller.update(1, dto);
    expect(result.title).toBe('Lead AI Engineer');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should delete job description (DELETE /api/v1/jobs/:id)', async () => {
    const result = await controller.remove(1);
    expect(result).toEqual({ success: true, message: 'Job description 1 deleted.' });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
