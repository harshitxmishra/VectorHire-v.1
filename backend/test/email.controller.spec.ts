import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailController } from '../src/email/email.controller';
import { EmailService } from '../src/email/email.service';
import { SendEmailDto } from '../src/email/dto/send-email.dto';

describe('EmailController', () => {
  let controller: EmailController;
  let service: EmailService;

  const mockResponse = {
    sent: 2,
    failed: 0,
    skipped: 1,
    results: [
      { candidateId: 1, status: 'sent' as const },
      { candidateId: 2, status: 'sent' as const },
      { candidateId: 3, status: 'skipped' as const, error: 'Already sent.' },
    ],
  };

  const mockService = {
    sendEmails: vi.fn().mockResolvedValue(mockResponse),
  };

  beforeEach(() => {
    service = mockService as unknown as EmailService;
    controller = new EmailController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send batch emails (POST /api/v1/emails/send)', async () => {
    const dto: SendEmailDto = {
      candidateIds: [1, 2, 3],
      type: 'assessment',
      assessmentTitle: 'Fullstack Assessment',
    };

    const result = await controller.sendEmails(dto);
    expect(result).toEqual(mockResponse);
    expect(service.sendEmails).toHaveBeenCalledWith(dto);
  });
});
