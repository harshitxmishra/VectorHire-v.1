import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class MatchCandidateJobDto {
  @IsNotEmpty({ message: 'candidate_id is required' })
  @IsInt({ message: 'candidate_id must be an integer' })
  @IsPositive({ message: 'candidate_id must be a positive integer' })
  candidate_id!: number;

  @IsNotEmpty({ message: 'job_description_id is required' })
  @IsInt({ message: 'job_description_id must be an integer' })
  @IsPositive({ message: 'job_description_id must be a positive integer' })
  job_description_id!: number;
}
