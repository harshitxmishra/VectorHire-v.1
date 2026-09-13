import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CandidateSortField, CandidateSortOrder } from '@/lib/repositories/candidate-repository';

export const ALLOWED_SORT_FIELDS: CandidateSortField[] = [
  'ai_score',
  'created_at',
  'full_name',
  'test_code',
  'id',
];

export const ALLOWED_SORT_ORDERS: CandidateSortOrder[] = ['asc', 'desc'];

export class QueryCandidatesDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: CandidateSortField;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_ORDERS, {
    message: `sortOrder must be one of: ${ALLOWED_SORT_ORDERS.join(', ')}`,
  })
  sortOrder?: CandidateSortOrder;

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
  limit: number = 20;
}
