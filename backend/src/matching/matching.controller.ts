import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { MatchingService, MatchResult } from './matching.service';
import { MatchCandidateJobDto } from './dto/match-candidate-job.dto';
import { QueryJobMatchesDto } from './dto/query-job-matches.dto';
import { BatchMatchDto } from './dto/batch-match.dto';
import { JobMatchResult } from '@/lib/types';
import { PaginatedJobMatches } from '@/lib/repositories/job-match-repository';

@Controller('matching')
@UseGuards(SupabaseAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  async getMatches(
    @Query('jobDescriptionId') jobDescriptionId?: string,
  ): Promise<JobMatchResult[]> {
    if (!jobDescriptionId) {
      throw new BadRequestException('jobDescriptionId query param is required.');
    }
    const jdId = Number(jobDescriptionId);
    if (!Number.isFinite(jdId) || jdId <= 0) {
      throw new BadRequestException('jobDescriptionId must be a positive number.');
    }
    return this.matchingService.getMatchesForJD(jdId);
  }

  @Get('best')
  async getBestMatches(): Promise<Record<number, number>> {
    return this.matchingService.getBestMatches();
  }

  @Get('jd/:id')
  async getMatchesForJD(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<JobMatchResult[]> {
    return this.matchingService.getMatchesForJD(id);
  }

  @Get('jd/:id/paginated')
  async getPaginatedMatchesForJD(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryDto: QueryJobMatchesDto,
  ): Promise<PaginatedJobMatches> {
    return this.matchingService.getPaginatedMatchesForJD(id, queryDto);
  }

  @Post('jd/:id/run')
  async runJobMatching(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchMatchDto,
  ): Promise<{ evaluated: number; totalCandidates: number }> {
    return this.matchingService.batchEvaluateMatches(id, dto);
  }

  @Post('evaluate')
  async evaluateMatch(
    @Body() dto: MatchCandidateJobDto,
  ): Promise<MatchResult> {
    return this.matchingService.evaluateCandidateMatch(dto);
  }

  @Post()
  async matchCandidate(
    @Body() dto: MatchCandidateJobDto,
  ): Promise<MatchResult> {
    return this.matchingService.evaluateCandidateMatch(dto);
  }
}
