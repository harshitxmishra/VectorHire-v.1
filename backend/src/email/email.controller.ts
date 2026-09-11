import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { EmailService, SendEmailResponse } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('emails')
@UseGuards(SupabaseAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmails(
    @Body() dto: SendEmailDto,
  ): Promise<SendEmailResponse> {
    return this.emailService.sendEmails(dto);
  }
}
