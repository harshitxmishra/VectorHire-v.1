/**
 * 7-Stage Hiring Workflow State Machine
 *
 * Workflow Pipeline:
 * APPLIED -> SCREENING -> TECHNICAL_EVAL -> INTERVIEW_SCHEDULED -> INTERVIEW_COMPLETED -> OFFER_SENT -> HIRED / REJECTED
 *
 * Terminal Stages: HIRED, REJECTED
 */

export const HIRING_STAGES = [
  'APPLIED',
  'SCREENING',
  'TECHNICAL_EVAL',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'OFFER_SENT',
  'HIRED',
  'REJECTED',
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

/**
 * Normalization map to seamlessly support title-cased and legacy statuses:
 * e.g. "Applied", "Reviewing" -> SCREENING, "Shortlisted" -> SCREENING,
 * "Assessment Sent" / "Assessment Completed" -> TECHNICAL_EVAL,
 * "Offer Extended" -> OFFER_SENT, etc.
 */
const STAGE_ALIAS_MAP: Record<string, HiringStage> = {
  applied: 'APPLIED',
  screening: 'SCREENING',
  reviewing: 'SCREENING',
  reviewed: 'SCREENING',
  shortlisted: 'SCREENING',
  pending: 'SCREENING',
  new: 'APPLIED',
  technical_eval: 'TECHNICAL_EVAL',
  'technical eval': 'TECHNICAL_EVAL',
  'assessment sent': 'TECHNICAL_EVAL',
  'assessment completed': 'TECHNICAL_EVAL',
  'interview eligible': 'TECHNICAL_EVAL',
  interview_scheduled: 'INTERVIEW_SCHEDULED',
  'interview scheduled': 'INTERVIEW_SCHEDULED',
  interview: 'INTERVIEW_SCHEDULED',
  interview_completed: 'INTERVIEW_COMPLETED',
  'interview completed': 'INTERVIEW_COMPLETED',
  offer_sent: 'OFFER_SENT',
  'offer sent': 'OFFER_SENT',
  'offer extended': 'OFFER_SENT',
  hired: 'HIRED',
  rejected: 'REJECTED',
};

/**
 * Allowed next transitions from any given stage in the 7-stage hiring pipeline.
 */
export const ALLOWED_TRANSITIONS: Record<HiringStage, HiringStage[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['TECHNICAL_EVAL', 'REJECTED', 'APPLIED'],
  TECHNICAL_EVAL: ['INTERVIEW_SCHEDULED', 'REJECTED', 'SCREENING'],
  INTERVIEW_SCHEDULED: ['INTERVIEW_COMPLETED', 'REJECTED', 'TECHNICAL_EVAL'],
  INTERVIEW_COMPLETED: ['OFFER_SENT', 'REJECTED', 'INTERVIEW_SCHEDULED'],
  OFFER_SENT: ['HIRED', 'REJECTED', 'INTERVIEW_COMPLETED'],
  HIRED: ['REJECTED'], // Can be marked rejected/rescinded if necessary
  REJECTED: ['APPLIED', 'SCREENING'], // Can be reopened by recruiter with audit
};

/**
 * Display names for the 7 stages (user-facing UI)
 */
export const STAGE_DISPLAY_NAMES: Record<HiringStage, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  TECHNICAL_EVAL: 'Technical Eval',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
  OFFER_SENT: 'Offer Sent',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

/**
 * Normalizes any incoming string or legacy status into a canonical HiringStage.
 */
export function normalizeHiringStage(input: string | null | undefined): HiringStage {
  if (!input) return 'APPLIED';
  const clean = input.trim().toLowerCase();
  return STAGE_ALIAS_MAP[clean] || 'APPLIED';
}

/**
 * Validates whether a transition from `fromStage` to `toStage` is permitted.
 */
export function isValidStageTransition(
  fromStage: string | HiringStage,
  toStage: string | HiringStage
): { valid: boolean; normalizedFrom: HiringStage; normalizedTo: HiringStage; error?: string } {
  const normalizedFrom = normalizeHiringStage(fromStage);
  const normalizedTo = normalizeHiringStage(toStage);

  // No-op transition is always valid
  if (normalizedFrom === normalizedTo) {
    return { valid: true, normalizedFrom, normalizedTo };
  }

  const allowed = ALLOWED_TRANSITIONS[normalizedFrom] || [];
  if (!allowed.includes(normalizedTo)) {
    return {
      valid: false,
      normalizedFrom,
      normalizedTo,
      error: `Invalid transition from ${STAGE_DISPLAY_NAMES[normalizedFrom]} to ${STAGE_DISPLAY_NAMES[normalizedTo]}. Allowed next stages: ${allowed.map((s) => STAGE_DISPLAY_NAMES[s]).join(', ')}`,
    };
  }

  return { valid: true, normalizedFrom, normalizedTo };
}

/**
 * Formats a structured audit log entry for status transitions.
 */
export interface StageTransitionAuditLog {
  candidateId: number;
  fromStage: HiringStage;
  toStage: HiringStage;
  timestamp: string;
  actor?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function createTransitionAuditLog(
  candidateId: number,
  fromStage: string | HiringStage,
  toStage: string | HiringStage,
  actor = 'system',
  reason?: string,
  metadata?: Record<string, unknown>
): StageTransitionAuditLog {
  return {
    candidateId,
    fromStage: normalizeHiringStage(fromStage),
    toStage: normalizeHiringStage(toStage),
    timestamp: new Date().toISOString(),
    actor,
    reason: reason || `Transitioned from ${STAGE_DISPLAY_NAMES[normalizeHiringStage(fromStage)]} to ${STAGE_DISPLAY_NAMES[normalizeHiringStage(toStage)]}`,
    metadata,
  };
}
