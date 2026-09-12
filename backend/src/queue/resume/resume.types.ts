export interface ResumeJobData {
  candidateId: number;
  correlationId: string;
  enqueuedAt: number;
}

export interface ResumeJobResult {
  candidateId: number;
  status: 'success' | 'failed';
  error?: string;
  correlationId: string;
  processedAt: string;
}

export interface ResumeJobStatusResponse {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
  correlationId?: string;
  result?: ResumeJobResult;
  error?: string;
  enqueuedAt?: number;
  finishedAt?: number;
}
