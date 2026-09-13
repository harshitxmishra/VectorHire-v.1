import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsService } from '../src/jobs/jobs.service';
import { JobRepository } from '@/lib/repositories/job-repository';
import { NotFoundException } from '@nestjs/common';

describe('JobsService (Application Layer)', () => {
  let service: JobsService;
  let mockRepository: JobRepository;

  const mockJob = {
    id: 10,
    created_at: '2026-09-11T10:00:00.000Z',
    updated_at: '2026-09-11T10:00:00.000Z',
    title: 'Full Stack Developer',
    requirements: 'React, Node.js, SQL experience required.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository = {
      findAll: vi.fn().mockResolvedValue([mockJob]),
      findById: vi.fn().mockResolvedValue(mockJob),
      create: vi.fn().mockResolvedValue(mockJob),
      update: vi.fn().mockResolvedValue({ ...mockJob, title: 'Lead Developer' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    service = new JobsService(mockRepository);
  });

  it('findAll() delegates to jobRepository.findAll()', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockJob]);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });

  it('findOne() delegates to jobRepository.findById() and throws 404 if missing', async () => {
    const result = await service.findOne(10);
    expect(result).toEqual(mockJob);
    expect(mockRepository.findById).toHaveBeenCalledWith(10);

    (mockRepository.findById as any).mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create() delegates to jobRepository.create()', async () => {
    const dto = { title: 'Full Stack Developer', requirements: 'React, Node.js, SQL experience required.' };
    const result = await service.create(dto);
    expect(result).toEqual(mockJob);
    expect(mockRepository.create).toHaveBeenCalledWith(dto);
  });

  it('update() delegates to jobRepository.update()', async () => {
    const dto = { title: 'Lead Developer', requirements: 'React, Node.js, SQL experience required.' };
    const result = await service.update(10, dto);
    expect(result.title).toBe('Lead Developer');
    expect(mockRepository.update).toHaveBeenCalledWith(10, dto);
  });

  it('remove() delegates to jobRepository.delete()', async () => {
    const result = await service.remove(10);
    expect(result).toEqual({ success: true, message: 'Job description 10 deleted.' });
    expect(mockRepository.delete).toHaveBeenCalledWith(10);
  });
});
