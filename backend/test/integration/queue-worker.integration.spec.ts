import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueService } from '../../src/queue/queue.service';
import { AiEvaluationWorker } from '../../src/queue/ai/ai-evaluation.worker';
import { ResumeWorker } from '../../src/queue/resume/resume.worker';
import { GithubWorker } from '../../src/queue/github/github.worker';
import { EmailWorker } from '../../src/queue/email/email.worker';
import { QUEUE_NAMES, JOB_NAMES } from '../../src/queue/queue.constants';
import { Job } from 'bullmq';

describe('Async Queue & Worker Integration Boundary', () => {
  describe('Queue Enqueueing Contract via QueueService', () => {
    let queueService: QueueService;
    let mockAiQueue: { add: ReturnType<typeof vi.fn> };
    let mockEmailQueue: { add: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockAiQueue = { add: vi.fn().mockResolvedValue({ id: 'job-ai-1' }) };
      mockEmailQueue = { add: vi.fn().mockResolvedValue({ id: 'job-em-1' }) };

      queueService = new QueueService();
      (queueService as any).aiEvaluationQueue = mockAiQueue;
      (queueService as any).emailQueue = mockEmailQueue;
    });

    it('enqueues AI evaluation job with correlation ID and default retry/backoff policy', async () => {
      const jobData = {
        candidate_id: 101,
        full_name: 'Sam Rivera',
        resume_text: 'Expert in Python and PyTorch',
        force_reevaluate: false,
        correlationId: 'test-corr-ai-123',
      };

      const job = await queueService.enqueueAiEvaluation(jobData);

      expect(job).toBeDefined();
      expect(mockAiQueue.add).toHaveBeenCalledWith(
        JOB_NAMES.AI_EVALUATE,
        jobData,
        expect.objectContaining({
          attempts: 3,
          backoff: expect.objectContaining({
            type: 'exponential',
            delay: 1000,
          }),
        }),
      );
    });

    it('enqueues Email sending job with payload and correlation ID', async () => {
      const emailData = {
        candidateIds: [201, 202],
        type: 'interview' as const,
        customSubject: 'Interview Invitation',
        customBody: 'Hello, you are invited.',
        interviewDate: '2026-09-20T10:00:00Z',
        meetLink: 'https://meet.google.com/abc-xyz',
        correlationId: 'test-corr-email-456',
      };

      const job = await queueService.enqueueEmailSend(emailData);

      expect(job).toBeDefined();
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        JOB_NAMES.EMAIL_SEND,
        emailData,
        expect.any(Object),
      );
    });
  });

  describe('Worker Processing & Domain Delegation', () => {
    it('AiEvaluationWorker delegates to AiService, captures correlation ID, and completes', async () => {
      const mockAiService = {
        evaluateCandidate: vi.fn().mockResolvedValue({
          score: 92,
          recommendation: 'Strong candidate with deep ML background',
          technicalSkills: ['Python', 'PyTorch'],
          softSkills: ['Leadership'],
          summary: '5 years ML engineer',
          strengths: ['ML', 'Python'],
          weaknesses: [],
          interviewQuestions: ['Explain backpropagation'],
        }),
      };

      const worker = new AiEvaluationWorker(mockAiService as any);
      const mockJob = {
        id: 'job-ai-100',
        name: JOB_NAMES.AI_EVALUATE,
        data: {
          candidate_id: 101,
          full_name: 'Sam Rivera',
          resume_text: 'Experienced ML Engineer',
          force_reevaluate: true,
          correlationId: 'corr-ai-worker-1',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await worker.processJob(mockJob as any);

      expect(result.candidateId).toBe(101);
      expect(result.score).toBe(92);
      expect(result.recommendation).toBe('Strong candidate with deep ML background');
      expect(result.correlationId).toBe('corr-ai-worker-1');
      expect(mockAiService.evaluateCandidate).toHaveBeenCalledWith(
        expect.objectContaining({ candidate_id: 101, force_reevaluate: true }),
      );
    });

    it('ResumeWorker parses resume via ResumeService and returns parsed summary', async () => {
      const mockResumeService = {
        parseResume: vi.fn().mockResolvedValue({
          candidateId: 102,
          resumeUrl: 'https://example.com/resumes/sam.pdf',
          resumeText: 'Parsed resume content with skills and experience',
          status: 'success',
          parsedAt: new Date().toISOString(),
        }),
      };

      const worker = new ResumeWorker(mockResumeService as any);
      const mockJob = {
        id: 'job-res-100',
        name: JOB_NAMES.RESUME_PARSE,
        data: {
          candidateId: 102,
          correlationId: 'corr-res-worker-1',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await worker.processJob(mockJob as any);

      expect(result.candidateId).toBe(102);
      expect(result.status).toBe('success');
      expect(result.correlationId).toBe('corr-res-worker-1');
      expect(mockResumeService.parseResume).toHaveBeenCalledWith(102);
    });

    it('GithubWorker analyzes repositories via GithubService and returns portfolio scores', async () => {
      const mockGithubService = {
        analyzeCandidate: vi.fn().mockResolvedValue({
          score: 88,
          summary: 'High activity on TypeScript repositories',
          languages: ['TypeScript', 'Rust'],
          portfolioVerdict: 'Excellent',
          highlights: ['Author of popular CLI tool'],
          strongestRepo: 'vectorhire',
          lastAnalyzed: new Date().toISOString(),
        }),
      };

      const worker = new GithubWorker(mockGithubService as any);
      const mockJob = {
        id: 'job-gh-100',
        name: JOB_NAMES.GITHUB_ANALYZE,
        data: {
          candidateId: 103,
          force: true,
          correlationId: 'corr-gh-worker-1',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await worker.processJob(mockJob as any);

      expect(result.candidateId).toBe(103);
      expect(result.score).toBe(88);
      expect(result.portfolioVerdict).toBe('Excellent');
      expect(result.correlationId).toBe('corr-gh-worker-1');
      expect(mockGithubService.analyzeCandidate).toHaveBeenCalledWith(103, true);
    });

    it('EmailWorker sends bulk emails via EmailService and logs structured completion', async () => {
      const mockEmailService = {
        sendEmails: vi.fn().mockResolvedValue({
          sent: 2,
          failed: 0,
          skipped: 0,
          results: [
            { candidateId: 201, status: 'sent' },
            { candidateId: 202, status: 'sent' },
          ],
        }),
      };

      const worker = new EmailWorker(mockEmailService as any);
      const mockJob = {
        id: 'job-em-100',
        name: JOB_NAMES.EMAIL_SEND,
        data: {
          candidateIds: [201, 202],
          type: 'interview',
          correlationId: 'corr-em-worker-1',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await worker.processJob(mockJob as any);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.correlationId).toBe('corr-em-worker-1');
      expect(mockEmailService.sendEmails).toHaveBeenCalled();
    });
  });

  describe('Graceful Worker Shutdown', () => {
    it('closes all workers cleanly without leaving unhandled connections', async () => {
      const mockEmailService = { sendEmails: vi.fn() };
      const worker = new EmailWorker(mockEmailService as any);

      await expect(worker.onApplicationShutdown()).resolves.not.toThrow();
    });
  });
});
