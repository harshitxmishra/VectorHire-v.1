import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumeController } from '../src/resume/resume.controller';
import { ResumeService } from '../src/resume/resume.service';

describe('ResumeController', () => {
  let controller: ResumeController;
  let service: ResumeService;

  const mockService = {
    parseResume: vi.fn().mockResolvedValue({ candidateId: 1, status: 'success' }),
  };

  beforeEach(() => {
    service = mockService as unknown as ResumeService;
    controller = new ResumeController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should parse candidate resume (POST /api/v1/candidates/:id/parse-resume)', async () => {
    const result = await controller.parseResume(1);
    expect(result).toEqual({ candidateId: 1, status: 'success' });
    expect(service.parseResume).toHaveBeenCalledWith(1);
  });
});
