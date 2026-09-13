export interface DatasetImportJobData {
  uploadId: string;
  datasetName: string;
  uploadedBy: string | null;
  mode: 'replace' | 'append';
  correlationId: string;
  enqueuedAt: number;
}

export interface DatasetImportJobResult {
  datasetId: number;
  datasetName: string;
  mode: 'replace' | 'append';
  totalCandidates: number;
  status: 'completed' | 'failed';
  correlationId: string;
  processedAt: string;
}

export interface DatasetJobStatusResponse {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  correlationId?: string;
  result?: DatasetImportJobResult;
  error?: string;
  enqueuedAt?: number;
  finishedAt?: number;
}
