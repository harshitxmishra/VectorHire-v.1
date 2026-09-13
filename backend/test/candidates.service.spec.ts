import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidatesService } from '../src/candidates/candidates.service';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import * as timelineDomain from '@/lib/services/timeline-service';
import { NotFoundException } from '@nestjs/common';

describe('CandidatesService (Application Layer)', () => {
  let service: CandidatesService;
  let mockRepository: CandidateRepository;

  const mockCandidate = {
    id: 10,
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
    college: 'BITS Pilani',
    cgpa: 9.2,
    status: 'Applied',
    ai_score: 92,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository = {
      findAll: vi.fn().mockResolvedValue([mockCandidate]),
      findById: vi.fn().mockResolvedValue(mockCandidate),
      findByIds: vi.fn().mockResolvedValue([mockCandidate]),
      create: vi.fn().mockResolvedValue(mockCandidate),
      createMany: vi.fn().mockResolvedValue([mockCandidate]),
      updateStatus: vi.fn().mockResolvedValue({ ...mockCandidate, status: 'Shortlisted' }),
      update: vi.fn().mockResolvedValue(mockCandidate),
      updateByEmail: vi.fn().mockResolvedValue([10]),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteAll: vi.fn().mockResolvedValue(undefined),
    };
    service = new CandidatesService(mockRepository);
  });

  it('findAll() delegates to candidateRepository.findAll()', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockCandidate]);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });

  it('findOne(id) delegates to candidateRepository.findById(id) and throws 404 if missing', async () => {
    const result = await service.findOne(10);
    expect(result).toEqual(mockCandidate);

    (mockRepository.findById as any).mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create() delegates to candidateRepository.create() and logs timeline event', async () => {
    const timelineSpy = vi.spyOn(timelineDomain, 'logTimelineEvent').mockResolvedValue(undefined as any);

    const result = await service.create({
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
      college: 'BITS Pilani',
      cgpa: 9.2,
    });

    expect(result).toEqual(mockCandidate);
    expect(mockRepository.create).toHaveBeenCalled();
    expect(timelineSpy).toHaveBeenCalledWith(10, 'applied', 'Candidate profile created');
  });

  it('updateStatus() delegates to candidateRepository.updateStatus() and logs timeline event', async () => {
    const timelineSpy = vi.spyOn(timelineDomain, 'logTimelineEvent').mockResolvedValue(undefined as any);

    const result = await service.updateStatus(10, 'Shortlisted');
    expect(result.status).toBe('Shortlisted');
    expect(mockRepository.updateStatus).toHaveBeenCalledWith(10, 'Shortlisted');
    expect(timelineSpy).toHaveBeenCalledWith(10, 'status_changed', 'Moved to Shortlisted');
  });

  it('remove() delegates to candidateRepository.delete()', async () => {
    const result = await service.remove(10);
    expect(result).toEqual({ success: true, message: 'Candidate 10 deleted.' });
    expect(mockRepository.delete).toHaveBeenCalledWith(10);
  });

  it('removeAll() delegates to candidateRepository.deleteAll()', async () => {
    const result = await service.removeAll();
    expect(result).toEqual({ success: true, message: 'All candidate records purged successfully.' });
    expect(mockRepository.deleteAll).toHaveBeenCalled();
  });
});
