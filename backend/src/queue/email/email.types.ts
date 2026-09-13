import { EmailType } from '@/lib/services/email-service';

export interface EmailJobData {
  candidateIds: number[];
  type: EmailType;
  force?: boolean;
  assessmentTitle?: string;
  assessmentDeadline?: string;
  assessmentUrl?: string;
  recruiterName?: string;
  correlationId: string;
  enqueuedAt: string;
  requestedBy?: string;
}

export interface EmailJobResult {
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  results: Array<{
    candidateId: number;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
  }>;
  correlationId: string;
  processedAt: string;
}

export interface EmailJobStatusResponse {
  jobId: string;
  state: 'completed' | 'active' | 'waiting' | 'delayed' | 'failed' | 'queued';
  correlationId?: string;
  result?: EmailJobResult;
  error?: string;
  enqueuedAt?: number;
  finishedAt?: number;
}
