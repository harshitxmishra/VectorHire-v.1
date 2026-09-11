import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateInterviewStatusDto {
  @IsNotEmpty({ message: 'status is required' })
  @IsIn(['completed', 'cancelled'], {
    message: "status must be either 'completed' or 'cancelled'",
  })
  status!: 'completed' | 'cancelled';
}
