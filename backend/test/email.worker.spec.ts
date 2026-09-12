import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailWorker } from '../src/queue/email/email.worker';
import { EmailService } from '../src/email/email.service';
import { Job } from 'bullmq';
import { EmailJobData, EmailJobResult } from '../src/queue/email/email.types';

// Mock BullMQ Worker
const mockWorkerInstance = {
  on: vi.fn().mockReturnThis(),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('bullmq', () => {
  return {
    Worker: vi.fn().mockImplementation((name, processor, opts) => {
      (mockWorkerInstance as any)._name = name;
      (mockWorkerInstance as any)._processor = processor;
      (mockWorkerInstance as any)._opts = opts;
      return mockWorkerInstance;
    }),
  };
});

// Mock Redis
const mockRedisClient = {
  quit: vi.fn().mockResolvedValue('OK'),
};

vi.mock('../src/queue/redis.config', () => ({
  createRedisClient: vi.fn(() => mockRedisClient),
}));

describe('EmailWorker', () => {
  let worker: EmailWorker;
  let mockEmailService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmailService = {
      sendEmails: vi.fn(),
    };

    worker = new EmailWorker(mockEmailService as unknown as EmailService);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  it('should initialize worker with concurrency 2 and attach event listeners', () => {
    worker.onModuleInit();

    expect(worker.getWorkerInstance()).toBeDefined();
    expect(mockWorkerInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should process email job successfully and return EmailJobResult', async () => {
    const jobData: EmailJobData = {
      candidateIds: [10, 20],
      type: 'assessment',
      force: false,
      assessmentTitle: 'Frontend React Test',
      correlationId: 'email-corr-123',
      enqueuedAt: '2026-09-12T10:00:00.000Z',
      requestedBy: 'recruiter-1',
    };

    const mockJob = {
      id: 'job-email-1',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 1,
    } as unknown as Job<EmailJobData, EmailJobResult>;

    mockEmailService.sendEmails.mockResolvedValue({
      sent: 1,
      failed: 0,
      skipped: 1,
      results: [
        { candidateId: 10, status: 'sent' },
        { candidateId: 20, status: 'skipped', error: 'Already sent.' },
      ],
    });

    const result = await worker.processJob(mockJob);

    expect(result).toEqual({
      sent: 1,
      failed: 0,
      skipped: 1,
      total: 2,
      results: [
        { candidateId: 10, status: 'sent' },
        { candidateId: 20, status: 'skipped', error: 'Already sent.' },
      ],
      correlationId: 'email-corr-123',
      processedAt: expect.any(String),
    });

    expect(mockEmailService.sendEmails).toHaveBeenCalledWith(jobData);
  });

  it('should rethrow errors during processing for BullMQ retry handling', async () => {
    const jobData: EmailJobData = {
      candidateIds: [10],
      type: 'offer',
      correlationId: 'email-corr-456',
      enqueuedAt: '2026-09-12T10:00:00.000Z',
    };

    const mockJob = {
      id: 'job-email-2',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 1,
    } as unknown as Job<EmailJobData, EmailJobResult>;

    mockEmailService.sendEmails.mockRejectedValue(new Error('SMTP Connection timeout'));

    await expect(worker.processJob(mockJob)).rejects.toThrow('SMTP Connection timeout');
  });

  it('should close worker and redis client on application shutdown', async () => {
    worker.onModuleInit();
    await worker.onApplicationShutdown();

    expect(mockWorkerInstance.close).toHaveBeenCalled();
    expect(mockRedisClient.quit).toHaveBeenCalled();
  });
});
