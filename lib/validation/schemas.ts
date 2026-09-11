import { PIPELINE_STAGES } from '@/lib/types';

export const ALL_ALLOWED_CANDIDATE_STATUSES = [
  ...PIPELINE_STAGES,
  'Pending',
  'New',
  'Reviewed',
  'Interview',
] as const;

export type AllowedCandidateStatus = (typeof ALL_ALLOWED_CANDIDATE_STATUSES)[number];

const statusLowerMap = new Map<string, AllowedCandidateStatus>();
ALL_ALLOWED_CANDIDATE_STATUSES.forEach((s) => {
  statusLowerMap.set(s.toLowerCase(), s);
});

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };

export function validateCandidateStatus(input: unknown): ValidationResult<AllowedCandidateStatus> {
  if (typeof input !== 'string' || !input.trim()) {
    return { success: false, error: 'status must be a non-empty string.', field: 'status' };
  }

  const normalized = statusLowerMap.get(input.trim().toLowerCase());
  if (!normalized) {
    return {
      success: false,
      error: `Invalid status '${input}'. Must be one of: ${ALL_ALLOWED_CANDIDATE_STATUSES.join(', ')}`,
      field: 'status',
    };
  }

  return { success: true, data: normalized };
}

export interface JobDescriptionInput {
  title: string;
  requirements: string;
}

export function validateJobDescriptionInput(body: unknown): ValidationResult<JobDescriptionInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a JSON object.' };
  }

  const obj = body as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const requirements = typeof obj.requirements === 'string' ? obj.requirements.trim() : '';

  if (!title) {
    return { success: false, error: 'title is required and cannot be empty.', field: 'title' };
  }
  if (title.length > 255) {
    return { success: false, error: 'title cannot exceed 255 characters.', field: 'title' };
  }

  if (!requirements) {
    return { success: false, error: 'requirements is required and cannot be empty.', field: 'requirements' };
  }
  if (requirements.length > 50000) {
    return { success: false, error: 'requirements cannot exceed 50,000 characters.', field: 'requirements' };
  }

  return { success: true, data: { title, requirements } };
}

export interface InterviewInput {
  candidate_id: number;
  interviewer_name: string;
  scheduled_date: string;
  duration_minutes: number;
}

export function validateInterviewInput(body: unknown): ValidationResult<InterviewInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a JSON object.' };
  }

  const obj = body as Record<string, unknown>;
  const candidate_id = Number(obj.candidate_id);
  const interviewer_name = typeof obj.interviewer_name === 'string' ? obj.interviewer_name.trim() : '';
  const scheduled_date = typeof obj.scheduled_date === 'string' ? obj.scheduled_date.trim() : '';
  const duration_minutes = typeof obj.duration_minutes === 'number' && Number.isFinite(obj.duration_minutes) ? obj.duration_minutes : 60;

  if (!Number.isFinite(candidate_id) || candidate_id <= 0) {
    return { success: false, error: 'candidate_id must be a positive integer.', field: 'candidate_id' };
  }

  if (!interviewer_name) {
    return { success: false, error: 'interviewer_name is required.', field: 'interviewer_name' };
  }

  if (!scheduled_date || isNaN(Date.parse(scheduled_date))) {
    return { success: false, error: 'scheduled_date must be a valid date string.', field: 'scheduled_date' };
  }

  if (duration_minutes <= 0 || duration_minutes > 480) {
    return { success: false, error: 'duration_minutes must be between 1 and 480.', field: 'duration_minutes' };
  }

  return {
    success: true,
    data: { candidate_id, interviewer_name, scheduled_date, duration_minutes },
  };
}

export function validateInterviewStatus(status: unknown): ValidationResult<'completed' | 'cancelled'> {
  if (status === 'completed' || status === 'cancelled') {
    return { success: true, data: status };
  }
  return { success: false, error: "status must be either 'completed' or 'cancelled'.", field: 'status' };
}

export interface EmailSendInput {
  candidateIds: number[];
  type: 'assessment' | 'interview' | 'offer';
  force?: boolean;
  assessmentTitle?: string;
  assessmentDeadline?: string;
  assessmentUrl?: string;
  recruiterName?: string;
}

export function validateEmailSendInput(body: unknown): ValidationResult<EmailSendInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a JSON object.' };
  }

  const obj = body as Record<string, unknown>;
  const rawIds = Array.isArray(obj.candidateIds) ? obj.candidateIds : [];
  const candidateIds = rawIds.map(Number).filter((id) => Number.isFinite(id) && id > 0);

  if (candidateIds.length === 0) {
    return { success: false, error: 'candidateIds must be a non-empty array of valid IDs.', field: 'candidateIds' };
  }

  const type = obj.type;
  if (type !== 'assessment' && type !== 'interview' && type !== 'offer') {
    return { success: false, error: "type must be 'assessment', 'interview', or 'offer'.", field: 'type' };
  }

  return {
    success: true,
    data: {
      candidateIds,
      type,
      force: obj.force === true,
      assessmentTitle: typeof obj.assessmentTitle === 'string' ? obj.assessmentTitle : undefined,
      assessmentDeadline: typeof obj.assessmentDeadline === 'string' ? obj.assessmentDeadline : undefined,
      assessmentUrl: typeof obj.assessmentUrl === 'string' ? obj.assessmentUrl : undefined,
      recruiterName: typeof obj.recruiterName === 'string' ? obj.recruiterName : undefined,
    },
  };
}

export function validateGitHubUrlInput(body: unknown): ValidationResult<string> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a JSON object.' };
  }

  const obj = body as Record<string, unknown>;
  const github = typeof obj.github === 'string' ? obj.github.trim() : '';

  if (!github) {
    return { success: false, error: 'github URL or username is required.', field: 'github' };
  }

  if (github.length > 500) {
    return { success: false, error: 'github parameter is too long.', field: 'github' };
  }

  return { success: true, data: github };
}
