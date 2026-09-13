import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ALLOWED_STATUSES, AllowedStatus } from './update-candidate-status.dto';

const statusLowerMap = new Map<string, AllowedStatus>();
ALLOWED_STATUSES.forEach((s) => statusLowerMap.set(s.toLowerCase(), s));

export class BulkUpdateCandidateStatusDto {
  @IsArray({ message: 'candidateIds must be an array of candidate IDs.' })
  @ArrayMinSize(1, { message: 'candidateIds must contain at least 1 candidate ID.' })
  @ArrayMaxSize(100, { message: 'candidateIds cannot exceed 100 candidate IDs per request.' })
  @IsInt({ each: true, message: 'Each candidate ID must be an integer.' })
  @Min(1, { each: true, message: 'Each candidate ID must be a positive integer.' })
  candidateIds!: number[];

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
