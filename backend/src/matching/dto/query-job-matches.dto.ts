import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { JobMatchSortField, JobMatchSortOrder } from '@/lib/repositories/job-match-repository';

export const ALLOWED_JOB_MATCH_SORT_FIELDS: JobMatchSortField[] = [
  'match_percentage',
  'evaluated_at',
  'id',
];

export const ALLOWED_JOB_MATCH_SORT_ORDERS: JobMatchSortOrder[] = ['asc', 'desc'];

export class QueryJobMatchesDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_JOB_MATCH_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_JOB_MATCH_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: JobMatchSortField;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_JOB_MATCH_SORT_ORDERS, {
    message: `sortOrder must be one of: ${ALLOWED_JOB_MATCH_SORT_ORDERS.join(', ')}`,
  })
  sortOrder?: JobMatchSortOrder;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;
}
