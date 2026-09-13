import { IsOptional, IsArray, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchMatchDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  candidate_ids?: number[];

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
