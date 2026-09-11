import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumeService } from '../src/resume/resume.service';
import { supabase } from '@/lib/supabase/client';
import * as resumeService from '@/lib/services/resume-service';
import { NotFoundException, BadRequestException, BadGatewayException } from '@nestjs/common';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/services/resume-service', () => ({
  parseResumeForCandidate: vi.fn(),
}));

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ResumeService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully parse candidate resume', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, resume_url: 'https://example.com/resume.pdf' },
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    (resumeService.parseResumeForCandidate as any).mockResolvedValue({
      candidateId: 1,
      status: 'success',
    });

    const result = await service.parseResume(1);
    expect(result).toEqual({ candidateId: 1, status: 'success' });
  });

  it('should throw NotFoundException if candidate does not exist', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(service.parseResume(999)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if candidate has no resume URL', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1, resume_url: null }, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(service.parseResume(1)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadGatewayException if parseResumeForCandidate fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, resume_url: 'https://example.com/resume.pdf' },
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    (resumeService.parseResumeForCandidate as any).mockResolvedValue({
      candidateId: 1,
      status: 'failed',
      error: 'Corrupt PDF',
    });

    await expect(service.parseResume(1)).rejects.toThrow(BadGatewayException);
  });
});
