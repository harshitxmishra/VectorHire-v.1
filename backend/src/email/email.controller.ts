import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { QueueService } from '../queue/queue.service';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailJobStatusResponse } from '../queue/email/email.types';
import { resolveCorrelationId } from '../common/utils/correlation-id.util';

export interface EnqueueEmailResponse {
  jobId: string;
  status: 'queued';
  correlationId: string;
}

@Controller('emails')
@UseGuards(SupabaseAuthGuard)
export class EmailController {
  constructor(
    private readonly queueService: QueueService,
    private readonly emailService: EmailService
  ) {}

  @Get('candidate/:candidateId')
  async getLogsByCandidateId(
    @Param('candidateId', ParseIntPipe) candidateId: number
  ) {
    return this.emailService.getLogsByCandidateId(candidateId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendEmails(
    @Body() dto: SendEmailDto,
    @Req() req: any,
    @Headers('x-correlation-id') correlationHeader?: string
  ): Promise<EnqueueEmailResponse> {
    const correlationId = resolveCorrelationId(correlationHeader);
    const enqueuedAt = new Date().toISOString();
    const requestedBy = req.user?.id;

    const job = await this.queueService.enqueueEmailSend({
      candidateIds: dto.candidateIds,
      type: dto.type,
      force: dto.force,
      assessmentTitle: dto.assessmentTitle,
      assessmentDeadline: dto.assessmentDeadline,
      assessmentUrl: dto.assessmentUrl,
      recruiterName: dto.recruiterName,
      correlationId,
      enqueuedAt,
      requestedBy,
    });

    return {
      jobId: job.id ?? correlationId,
      status: 'queued',
      correlationId,
    };
  }

  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Req() req: any,
  ): Promise<EmailJobStatusResponse> {
    const job = await this.queueService.getEmailJob(jobId);
    if (!job) {
      throw new NotFoundException(`Email job ${jobId} not found`);
    }

    if (job.data?.requestedBy && req.user?.id && job.data.requestedBy !== req.user.id) {
      throw new ForbiddenException('You are not authorized to view this email job');
    }

    const status = await this.queueService.getEmailJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`Email job ${jobId} not found`);
    }
    return status;
  }
}
