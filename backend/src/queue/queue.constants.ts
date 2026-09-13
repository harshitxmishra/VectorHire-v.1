export const QUEUE_NAMES = {
  DEMONSTRATOR: 'demonstrator-queue',
  AI_EVALUATION: 'ai-evaluation-queue',
  RESUME_PROCESSING: 'resume-processing-queue',
  GITHUB_PROCESSING: 'github-processing-queue',
  DATASET_PROCESSING: 'dataset-processing-queue',
  EMAIL_PROCESSING: 'email-processing-queue',
} as const;

export const JOB_NAMES = {
  DEMONSTRATOR_PING: 'demonstrator:ping',
  AI_EVALUATE: 'ai:evaluate',
  RESUME_PARSE: 'resume:parse',
  GITHUB_ANALYZE: 'github:analyze',
  DATASET_IMPORT: 'dataset:import',
  EMAIL_SEND: 'email:send',
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 3600, // keep completed jobs for 1 hour
    count: 1000,
  },
  removeOnFail: {
    age: 86400, // keep failed jobs for 24 hours for audit/inspection
    count: 5000,
  },
};
