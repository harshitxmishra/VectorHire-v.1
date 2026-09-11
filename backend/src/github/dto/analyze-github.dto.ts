import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class AnalyzeGitHubDto {
  @IsNotEmpty({ message: 'candidate_id is required' })
  @IsInt({ message: 'candidate_id must be an integer' })
  @IsPositive({ message: 'candidate_id must be a positive integer' })
  candidate_id!: number;
}
