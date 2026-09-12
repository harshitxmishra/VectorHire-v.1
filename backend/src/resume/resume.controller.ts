import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ResumeService } from './resume.service';
import { QueueService } from '../queue/queue.service';
import { ResumeJobStatusResponse } from '../queue/resume/resume.types';
import { resolveCorrelationId } from '../common/utils/correlation-id.util';

@Controller('candidates')
@UseGuards(SupabaseAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly queueService: QueueService
  ) {}

  @Post(':id/parse-resume')
  @HttpCode(HttpStatus.ACCEPTED)
  async parseResume(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-correlation-id') correlationHeader?: string
  ) {
    // Validate that candidate exists and has resume_url before enqueuing
    await this.resumeService.validateCandidateForParsing(id);

    const correlationId = resolveCorrelationId(correlationHeader);

    const job = await this.queueService.enqueueResumeProcessing({
      candidateId: id,
      correlationId,
      enqueuedAt: Date.now(),
    });

    return {
      jobId: job.id,
      status: 'queued',
      correlationId,
    };
  }

  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<ResumeJobStatusResponse> {
    const status = await this.queueService.getResumeJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`Resume processing job with ID ${jobId} not found`);
    }
    return status;
  }
}
