import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  BadRequestException,
  NotFoundException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { GithubService } from './github.service';
import { AnalyzeGitHubDto } from './dto/analyze-github.dto';
import { SearchGitHubDto } from './dto/search-github.dto';
import { QueueService } from '../queue/queue.service';
import { GithubJobStatusResponse } from '../queue/github/github.types';
import { GitHubIntelligence } from '@/lib/types';
import { resolveCorrelationId } from '../common/utils/correlation-id.util';

@Controller('ai/github')
@UseGuards(SupabaseAuthGuard)
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly queueService: QueueService
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async analyze(
    @Body() dto: AnalyzeGitHubDto,
    @Headers('x-correlation-id') correlationHeader?: string
  ) {
    const correlationId = resolveCorrelationId(correlationHeader);

    // Cache check: if candidate has fresh analysis (< 7 days) and force is false, return cached result immediately
    if (!dto.force) {
      const cached = await this.githubService.getCachedAnalysis(dto.candidate_id);
      if (cached) {
        return {
          jobId: `cached-${dto.candidate_id}`,
          status: 'completed',
          correlationId,
          result: cached,
        };
      }
    }

    const job = await this.queueService.enqueueGithubProcessing({
      candidateId: dto.candidate_id,
      force: dto.force,
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
  async getJobStatus(@Param('jobId') jobId: string): Promise<GithubJobStatusResponse> {
    const status = await this.queueService.getGithubJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`GitHub analysis job with ID ${jobId} not found`);
    }
    return status;
  }

  @Post('search')
  async search(
    @Body() dto: SearchGitHubDto,
  ): Promise<GitHubIntelligence> {
    const target = dto.github || dto.url;
    if (!target) {
      throw new BadRequestException('github URL or username is required.');
    }
    return this.githubService.searchUrl(target);
  }
}
