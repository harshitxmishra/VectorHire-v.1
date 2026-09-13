import { EmailLog } from '@/lib/types';

export type EmailLogType = 'assessment' | 'interview' | 'offer';
export type EmailLogStatus = 'pending' | 'sent' | 'failed';

export interface CreateEmailLogData {
  candidate_id: number;
  email_type: EmailLogType;
  recipient: string;
  status?: EmailLogStatus;
}

export interface EmailLogRepository {
  create(data: CreateEmailLogData): Promise<EmailLog>;
  markAsSent(id: number, sentAt?: string): Promise<void>;
  markAsFailed(id: number, errorMessage: string): Promise<void>;
  findSentCandidateIds(candidateIds: number[], emailType: EmailLogType): Promise<number[]>;
  findByCandidateId(candidateId: number): Promise<EmailLog[]>;
  findByType(emailType: EmailLogType): Promise<EmailLog[]>;
}
