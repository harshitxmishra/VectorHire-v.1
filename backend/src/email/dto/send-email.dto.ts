import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  IsIn,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';
import { EmailType } from '@/lib/services/email-service';

export class SendEmailDto {
  @IsArray({ message: 'candidateIds must be an array' })
  @ArrayNotEmpty({ message: 'candidateIds must not be empty' })
  @IsInt({ each: true, message: 'Each candidateId must be an integer' })
  @IsPositive({ each: true, message: 'Each candidateId must be a positive integer' })
  candidateIds!: number[];

  @IsIn(['assessment', 'interview', 'offer'], {
    message: "type must be 'assessment', 'interview', or 'offer'",
  })
  type!: EmailType;

  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsString()
  assessmentTitle?: string;

  @IsOptional()
  @IsString()
  assessmentDeadline?: string;

  @IsOptional()
  @IsString()
  assessmentUrl?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;
}
