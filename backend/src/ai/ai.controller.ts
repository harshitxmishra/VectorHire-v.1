import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { AiService, CandidateEvaluationResult } from './ai.service';
import { EvaluateCandidateDto } from './dto/evaluate-candidate.dto';

@Controller('ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('evaluate')
  async evaluateCandidate(
    @Body() dto: EvaluateCandidateDto,
  ): Promise<CandidateEvaluationResult> {
    return this.aiService.evaluateCandidate(dto);
  }
}
