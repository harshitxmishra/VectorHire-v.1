import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class EvaluateCandidateDto {
  @IsOptional()
  @IsInt()
  candidate_id?: number;

  @IsNotEmpty({ message: 'full_name is required' })
  @IsString()
  full_name!: string;

  @IsNotEmpty({ message: 'college is required' })
  @IsString()
  college!: string;

  @IsNumber({}, { message: 'cgpa must be a number' })
  @Min(0)
  @Max(10)
  cgpa!: number;

  @IsString()
  github!: string;

  @IsNotEmpty({ message: 'status is required' })
  @IsString()
  status!: string;

  @IsNumber({}, { message: 'ai_score must be a number' })
  @Min(0)
  @Max(100)
  ai_score!: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
