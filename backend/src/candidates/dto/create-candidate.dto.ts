import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ALLOWED_STATUSES, AllowedStatus } from './update-candidate-status.dto';

export class CreateCandidateDto {
  @IsNotEmpty({ message: 'full_name is required' })
  @IsString({ message: 'full_name must be a string' })
  full_name!: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsNotEmpty({ message: 'college is required' })
  @IsString({ message: 'college must be a string' })
  college!: string;

  @IsNotEmpty({ message: 'cgpa is required' })
  @IsNumber({}, { message: 'cgpa must be a number' })
  @Min(0, { message: 'cgpa cannot be negative' })
  @Max(10, { message: 'cgpa cannot exceed 10' })
  cgpa!: number;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  resume_url?: string;

  @IsOptional()
  @IsIn(ALLOWED_STATUSES, {
    message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
  })
  status?: AllowedStatus;

  @IsOptional()
  @IsNumber()
  ai_score?: number;
}
