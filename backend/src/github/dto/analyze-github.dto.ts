import { IsNotEmpty, IsInt, IsPositive, IsOptional, IsBoolean } from 'class-validator';

export class AnalyzeGitHubDto {
  @IsNotEmpty({ message: 'candidate_id is required' })
  @IsInt({ message: 'candidate_id must be an integer' })
  @IsPositive({ message: 'candidate_id must be a positive integer' })
  candidate_id!: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
