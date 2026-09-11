export const QUEUE_NAMES = {
  DEMONSTRATOR: 'demonstrator-queue',
} as const;

export const JOB_NAMES = {
  DEMONSTRATOR_PING: 'demonstrator:ping',
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
