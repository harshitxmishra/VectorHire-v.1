import { IsNotEmpty, IsString, IsIn, Validate } from 'class-validator';
import { Transform } from 'class-transformer';

export const ALLOWED_STATUSES = [
  'Applied',
  'Reviewing',
  'Shortlisted',
  'Assessment Sent',
  'Assessment Completed',
  'Interview Eligible',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Extended',
  'Rejected',
  'Hired',
  'Pending',
  'New',
  'Reviewed',
  'Interview',
] as const;

export type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

const statusLowerMap = new Map<string, AllowedStatus>();
ALLOWED_STATUSES.forEach((s) => statusLowerMap.set(s.toLowerCase(), s));

export class UpdateCandidateStatusDto {
  @IsNotEmpty({ message: 'status is required and cannot be empty.' })
  @IsString({ message: 'status must be a string.' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const normalized = statusLowerMap.get(value.trim().toLowerCase());
      return normalized || value;
    }
    return value;
  })
  @IsIn(ALLOWED_STATUSES, {
    message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
  })
  status!: AllowedStatus;
}
