import { IsNotEmpty, IsString, IsInt, IsPositive, IsDateString, Min, Max } from 'class-validator';

export class CreateInterviewDto {
  @IsNotEmpty({ message: 'candidate_id is required' })
  @IsInt({ message: 'candidate_id must be an integer' })
  @IsPositive({ message: 'candidate_id must be a positive integer' })
  candidate_id!: number;

  @IsNotEmpty({ message: 'interviewer_name is required' })
  @IsString({ message: 'interviewer_name must be a string' })
  interviewer_name!: string;

  @IsNotEmpty({ message: 'scheduled_date is required' })
  @IsDateString({}, { message: 'scheduled_date must be a valid ISO date string' })
  scheduled_date!: string;

  @IsNotEmpty({ message: 'duration_minutes is required' })
  @IsInt({ message: 'duration_minutes must be an integer' })
  @Min(1, { message: 'duration_minutes must be at least 1 minute' })
  @Max(480, { message: 'duration_minutes cannot exceed 480 minutes (8 hours)' })
  duration_minutes!: number;
}
