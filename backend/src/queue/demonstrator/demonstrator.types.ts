export interface DemonstratorJobData {
  message: string;
  correlationId: string;
  timestamp: number;
  shouldFail?: boolean;
}

export interface DemonstratorJobResult {
  processed: boolean;
  receivedMessage: string;
  correlationId: string;
  processedAt: string;
}
