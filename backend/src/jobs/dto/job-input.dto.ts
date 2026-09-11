import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty({ message: 'title is required and cannot be empty.' })
  @IsString({ message: 'title must be a string.' })
  @MaxLength(255, { message: 'title cannot exceed 255 characters.' })
  title!: string;

  @IsNotEmpty({ message: 'requirements is required and cannot be empty.' })
  @IsString({ message: 'requirements must be a string.' })
  @MaxLength(50000, { message: 'requirements cannot exceed 50,000 characters.' })
  requirements!: string;
}

export class UpdateJobDto extends CreateJobDto {}
