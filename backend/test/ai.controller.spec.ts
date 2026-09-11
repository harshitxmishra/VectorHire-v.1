import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiController } from '../src/ai/ai.controller';
import { AiService } from '../src/ai/ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockEvaluation = {
    score: 88,
    summary: 'Solid full-stack engineering profile',
    strengths: ['NestJS', 'PostgreSQL', 'TypeScript'],
    weaknesses: ['Limited distributed systems experience'],
    recommendation: 'Advance to technical interview',
    interviewQuestions: ['Explain dependency injection in NestJS', 'How do you design database indexes?'],
  };

  const mockService = {
    evaluateCandidate: vi.fn().mockResolvedValue(mockEvaluation),
  };

  beforeEach(() => {
    service = mockService as unknown as AiService;
    controller = new AiController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should evaluate candidate (POST /api/v1/ai/evaluate)', async () => {
    const dto = {
      candidate_id: 10,
      full_name: 'Jane Doe',
      college: 'MIT',
      cgpa: 9.1,
      github: 'https://github.com/janedoe',
      status: 'screened',
      ai_score: 85,
    };
    const result = await controller.evaluateCandidate(dto);
    expect(result).toEqual(mockEvaluation);
    expect(service.evaluateCandidate).toHaveBeenCalledWith(dto);
  });
});
