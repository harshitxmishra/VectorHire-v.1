export interface AiEvaluationJobData {
  candidate_id?: number;
  full_name: string;
  college: string;
  cgpa: number;
  github: string;
  status: string;
  ai_score: number;
  force?: boolean;
  correlationId: string;
  enqueuedAt: number;
}

export interface AiEvaluationJobResult {
  candidateId?: number;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
  correlationId: string;
  processedAt: string;
}

export interface JobStatusResponse {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
  correlationId?: string;
  result?: AiEvaluationJobResult | any;
  error?: string;
  enqueuedAt?: number;
  finishedAt?: number;
}
