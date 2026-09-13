import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidatesController } from '../src/candidates/candidates.controller';
import { CandidatesService } from '../src/candidates/candidates.service';
import { NotFoundException } from '@nestjs/common';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let service: CandidatesService;

  const mockCandidate = {
    id: 1,
    full_name: 'John Doe',
    email: 'john@example.com',
    college: 'IIT Delhi',
    cgpa: 8.9,
    status: 'Applied',
    ai_score: 85,
  };

  const mockPaginated = {
    candidates: [mockCandidate],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockService = {
    findAll: vi.fn().mockResolvedValue([mockCandidate]),
    findPaginated: vi.fn().mockResolvedValue(mockPaginated),
    findOne: vi.fn().mockImplementation(async (id: number) => {
      if (id === 1) return mockCandidate;
      throw new NotFoundException(`Candidate with ID ${id} not found.`);
    }),
    create: vi.fn().mockResolvedValue(mockCandidate),
    updateStatus: vi.fn().mockResolvedValue({ ...mockCandidate, status: 'Shortlisted' }),
    bulkUpdateStatus: vi.fn().mockResolvedValue({ updated: 1, candidates: [{ ...mockCandidate, status: 'Shortlisted' }] }),
    remove: vi.fn().mockResolvedValue({ success: true, message: 'Candidate 1 deleted.' }),
    removeAll: vi.fn().mockResolvedValue({ success: true, message: 'All candidate records purged successfully.' }),
  };

  beforeEach(() => {
    service = mockService as unknown as CandidatesService;
    controller = new CandidatesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all candidates when no query params are provided', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockCandidate]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return paginated candidates when query parameters are supplied', async () => {
    const queryDto: any = {
      search: 'John',
      status: 'Applied',
      page: 1,
      limit: 20,
    };
    const result = await controller.findAll(queryDto);
    expect(result).toEqual(mockPaginated);
    expect(service.findPaginated).toHaveBeenCalledWith(queryDto);
  });

  it('should return single candidate by ID (GET /api/v1/candidates/:id)', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockCandidate);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if candidate not found', async () => {
    await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should create candidate (POST /api/v1/candidates)', async () => {
    const dto: any = {
      full_name: 'John Doe',
      email: 'john@example.com',
      college: 'IIT Delhi',
      cgpa: 8.9,
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockCandidate);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should update candidate status (PATCH /api/v1/candidates/:id)', async () => {
    const result = await controller.updateStatus(1, { status: 'Shortlisted' });
    expect(result.status).toBe('Shortlisted');
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'Shortlisted');
  });

  it('should bulk update candidate statuses (PATCH /api/v1/candidates/bulk-status)', async () => {
    const bulkDto: any = {
      candidateIds: [1],
      status: 'Shortlisted',
    };
    const result = await controller.bulkUpdateStatus(bulkDto);
    expect(result).toEqual({
      updated: 1,
      candidates: [{ ...mockCandidate, status: 'Shortlisted' }],
    });
    expect(service.bulkUpdateStatus).toHaveBeenCalledWith([1], 'Shortlisted');
  });

  it('should remove candidate by ID (DELETE /api/v1/candidates/:id)', async () => {
    const result = await controller.remove(1);
    expect(result).toEqual({ success: true, message: 'Candidate 1 deleted.' });
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('should purge all candidates (DELETE /api/v1/candidates)', async () => {
    const result = await controller.removeAll();
    expect(result).toEqual({ success: true, message: 'All candidate records purged successfully.' });
    expect(service.removeAll).toHaveBeenCalled();
  });
});
