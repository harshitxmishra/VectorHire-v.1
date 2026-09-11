import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidatesService } from '../src/candidates/candidates.service';
import * as candidateDomain from '@/lib/services/candidate-service';
import * as datasetDomain from '@/lib/services/dataset-service';
import * as timelineDomain from '@/lib/services/timeline-service';
import { NotFoundException } from '@nestjs/common';

describe('CandidatesService (Application Layer)', () => {
  let service: CandidatesService;

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
    service = new CandidatesService();
    vi.restoreAllMocks();
  });

  it('findAll() delegates to getCandidates()', async () => {
    vi.spyOn(candidateDomain, 'getCandidates').mockResolvedValue([mockCandidate as any]);
    const result = await service.findAll();
    expect(result).toEqual([mockCandidate]);
    expect(candidateDomain.getCandidates).toHaveBeenCalled();
  });

  it('findOne(id) delegates to getCandidateById(id) and throws 404 if missing', async () => {
    vi.spyOn(candidateDomain, 'getCandidateById').mockResolvedValue(mockCandidate as any);
    const result = await service.findOne(10);
    expect(result).toEqual(mockCandidate);

    vi.spyOn(candidateDomain, 'getCandidateById').mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create() delegates to insertCandidates() and logs timeline event', async () => {
    vi.spyOn(candidateDomain, 'insertCandidates').mockResolvedValue([mockCandidate as any]);
    const timelineSpy = vi.spyOn(timelineDomain, 'logTimelineEvent').mockResolvedValue(undefined as any);

    const result = await service.create({
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
      college: 'BITS Pilani',
      cgpa: 9.2,
    });

    expect(result).toEqual(mockCandidate);
    expect(candidateDomain.insertCandidates).toHaveBeenCalled();
    expect(timelineSpy).toHaveBeenCalledWith(10, 'applied', 'Candidate profile created');
  });

  it('updateStatus() delegates to updateCandidateStatus() and logs timeline event', async () => {
    vi.spyOn(candidateDomain, 'getCandidateById').mockResolvedValue(mockCandidate as any);
    vi.spyOn(candidateDomain, 'updateCandidateStatus').mockResolvedValue({
      ...mockCandidate,
      status: 'Shortlisted',
    } as any);
    const timelineSpy = vi.spyOn(timelineDomain, 'logTimelineEvent').mockResolvedValue(undefined as any);

    const result = await service.updateStatus(10, 'Shortlisted');
    expect(result.status).toBe('Shortlisted');
    expect(candidateDomain.updateCandidateStatus).toHaveBeenCalledWith(10, 'Shortlisted');
    expect(timelineSpy).toHaveBeenCalledWith(10, 'status_changed', 'Moved to Shortlisted');
  });

  it('remove() delegates to deleteCandidate()', async () => {
    vi.spyOn(candidateDomain, 'getCandidateById').mockResolvedValue(mockCandidate as any);
    const deleteSpy = vi.spyOn(candidateDomain, 'deleteCandidate').mockResolvedValue(undefined as any);

    const result = await service.remove(10);
    expect(result).toEqual({ success: true, message: 'Candidate 10 deleted.' });
    expect(deleteSpy).toHaveBeenCalledWith(10);
  });

  it('removeAll() delegates to deleteAllCandidates()', async () => {
    const purgeSpy = vi.spyOn(datasetDomain, 'deleteAllCandidates').mockResolvedValue(undefined as any);
    const result = await service.removeAll();
    expect(result).toEqual({ success: true, message: 'All candidate records purged successfully.' });
    expect(purgeSpy).toHaveBeenCalled();
  });
});
