import { GitHubIntelligence } from '@/lib/types';

export interface GithubJobData {
  candidateId: number;
  force?: boolean;
  correlationId: string;
  enqueuedAt: number;
}

export interface GithubJobResult extends GitHubIntelligence {
  candidateId: number;
  correlationId: string;
  processedAt: string;
}

export interface GithubJobStatusResponse {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
  correlationId?: string;
  result?: GithubJobResult;
  error?: string;
  enqueuedAt?: number;
  finishedAt?: number;
}
