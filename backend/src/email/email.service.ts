import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { sendCandidateEmail, EmailType } from '@/lib/services/email-service';
import { SendEmailDto } from './dto/send-email.dto';
import { EMAIL_LOG_REPOSITORY } from './email.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { EmailLogRepository } from '@/lib/repositories/email-log-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';

const STATUS_AFTER_SEND: Record<EmailType, string | null> = {
  assessment: 'Assessment Sent',
  offer: 'Offer Extended',
  interview: null,
};

export interface SendEmailResponse {
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    candidateId: number;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
  }>;
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_LOG_REPOSITORY)
    private readonly emailLogRepo: EmailLogRepository,
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: CandidateRepository,
  ) {}

  async getLogsByCandidateId(candidateId: number) {
    try {
      const candidate = await this.candidateRepo.findById(candidateId);
      if (!candidate) {
        throw new NotFoundException(`Candidate with ID ${candidateId} not found.`);
      }
      return await this.emailLogRepo.findByCandidateId(candidateId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : `Failed to fetch email logs for candidate ${candidateId}`;
      throw new InternalServerErrorException(message);
    }
  }

  async sendEmails(dto: SendEmailDto): Promise<SendEmailResponse> {
    const {
      candidateIds,
      type,
      force,
      assessmentTitle,
      assessmentDeadline,
      assessmentUrl,
      recruiterName,
    } = dto;

    let candidates;
    try {
      candidates = await this.candidateRepo.findByIds(candidateIds);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Candidates not found.';
      throw new InternalServerErrorException(message);
    }

    if (!candidates || candidates.length === 0) {
      throw new InternalServerErrorException('Candidates not found.');
    }

    let alreadySentIds = new Set<number>();
    if (!force) {
      const sentIds = await this.emailLogRepo.findSentCandidateIds(candidateIds, type);
      alreadySentIds = new Set(sentIds);
    }

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        if (alreadySentIds.has(candidate.id)) {
          return {
            candidateId: candidate.id,
            status: 'skipped' as const,
            error: 'Already sent.',
          };
        }

        const result = await sendCandidateEmail(
          candidate.id,
          type,
          candidate.email,
          candidate.full_name,
          {
            assessmentTitle,
            assessmentDeadline,
            assessmentUrl,
            recruiterName,
          },
          this.emailLogRepo,
        );

        if (result.status === 'sent' && STATUS_AFTER_SEND[type]) {
          await this.candidateRepo.updateStatus(candidate.id, STATUS_AFTER_SEND[type]);
        }

        return { candidateId: candidate.id, ...result };
      }),
    );

    return {
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    };
  }
}
