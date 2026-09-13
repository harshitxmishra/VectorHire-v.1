import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';
import { EvaluateCandidateDto } from './dto/evaluate-candidate.dto';
import { QueueService } from '../queue/queue.service';
import { JobStatusResponse } from '../queue/ai/ai-evaluation.types';
import { resolveCorrelationId } from '../common/utils/correlation-id.util';

@Controller('ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly queueService: QueueService
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('evaluate')
  @HttpCode(HttpStatus.ACCEPTED)
  async evaluateCandidate(
    @Body() dto: EvaluateCandidateDto,
    @Headers('x-correlation-id') correlationHeader?: string
  ) {
    const correlationId = resolveCorrelationId(correlationHeader);

    // Cache check: if candidate already has an evaluation and force is false, return cached result immediately
    if (dto.candidate_id && !dto.force) {
      const cached = await this.aiService.getCachedEvaluation(dto.candidate_id);
      if (cached) {
        return {
          jobId: `cached-${dto.candidate_id}`,
          status: 'completed',
          correlationId,
          result: cached,
        };
      }
    }

    const job = await this.queueService.enqueueAiEvaluation({
      ...dto,
      correlationId,
      enqueuedAt: Date.now(),
    });

    return {
      jobId: job.id,
      status: 'queued',
      correlationId,
    };
  }

  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatusResponse> {
    const status = await this.queueService.getAiEvaluationJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    return status;
  }
}
