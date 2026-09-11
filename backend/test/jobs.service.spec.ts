import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsService } from '../src/jobs/jobs.service';
import * as jobDomain from '@/lib/services/job-description-service';

describe('JobsService (Application Layer)', () => {
  let service: JobsService;

  const mockJob = {
    id: 10,
    created_at: '2026-09-11T10:00:00.000Z',
    updated_at: '2026-09-11T10:00:00.000Z',
    title: 'Full Stack Developer',
    requirements: 'React, Node.js, SQL experience required.',
  };

  beforeEach(() => {
    service = new JobsService();
    vi.restoreAllMocks();
  });

  it('findAll() delegates to getJobDescriptions()', async () => {
    vi.spyOn(jobDomain, 'getJobDescriptions').mockResolvedValue([mockJob]);
    const result = await service.findAll();
    expect(result).toEqual([mockJob]);
    expect(jobDomain.getJobDescriptions).toHaveBeenCalled();
  });

  it('create() delegates to createJobDescription()', async () => {
    vi.spyOn(jobDomain, 'createJobDescription').mockResolvedValue(mockJob);
    const dto = { title: 'Full Stack Developer', requirements: 'React, Node.js, SQL experience required.' };
    const result = await service.create(dto);
    expect(result).toEqual(mockJob);
    expect(jobDomain.createJobDescription).toHaveBeenCalledWith(dto);
  });

  it('update() delegates to updateJobDescription()', async () => {
    vi.spyOn(jobDomain, 'updateJobDescription').mockResolvedValue({ ...mockJob, title: 'Lead Developer' });
    const dto = { title: 'Lead Developer', requirements: 'React, Node.js, SQL experience required.' };
    const result = await service.update(10, dto);
    expect(result.title).toBe('Lead Developer');
    expect(jobDomain.updateJobDescription).toHaveBeenCalledWith(10, dto);
  });

  it('remove() delegates to deleteJobDescription()', async () => {
    const deleteSpy = vi.spyOn(jobDomain, 'deleteJobDescription').mockResolvedValue(undefined as any);
    const result = await service.remove(10);
    expect(result).toEqual({ success: true, message: 'Job description 10 deleted.' });
    expect(deleteSpy).toHaveBeenCalledWith(10);
  });
});
