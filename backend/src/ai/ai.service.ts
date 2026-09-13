import {
  Injectable,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import { getOrAnalyzeGitHub } from '@/lib/services/github-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { EvaluateCandidateDto } from './dto/evaluate-candidate.dto';

export type CandidateEvaluationResult = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
};

const systemPrompt =
  `You are a senior technical recruiter evaluating software engineering candidates.

Evaluate the candidate objectively.

Score the candidate from 0-100.`;

const evaluationSchema: AISchema = {
  type: 'object',
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string' },
    interviewQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'score',
    'summary',
    'strengths',
    'weaknesses',
    'recommendation',
    'interviewQuestions',
  ],
};

function isValidEvaluationResult(value: unknown): value is CandidateEvaluationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.score === 'number' &&
    Number.isFinite(result.score) &&
    typeof result.summary === 'string' &&
    typeof result.recommendation === 'string' &&
    Array.isArray(result.strengths) &&
    result.strengths.every((item) => typeof item === 'string') &&
    Array.isArray(result.weaknesses) &&
    result.weaknesses.every((item) => typeof item === 'string') &&
    Array.isArray(result.interviewQuestions) &&
    result.interviewQuestions.every((item) => typeof item === 'string')
  );
}

@Injectable()
export class AiService {
  async getCachedEvaluation(candidateId: number): Promise<CandidateEvaluationResult | null> {
    const { data: cached } = await supabase
      .from('candidates')
      .select('ai_evaluation')
      .eq('id', candidateId)
      .single();

    if (cached?.ai_evaluation) {
      return cached.ai_evaluation as CandidateEvaluationResult;
    }
    return null;
  }

  async evaluateCandidate(dto: EvaluateCandidateDto): Promise<CandidateEvaluationResult> {
    const force = dto.force === true;

    // Cache check: never re-run AI for a candidate that already has an evaluation,
    // unless the recruiter explicitly requests "force" (Re-evaluate).
    if (dto.candidate_id && !force) {
      const cached = await this.getCachedEvaluation(dto.candidate_id);
      if (cached) {
        return cached;
      }
    }

    let githubContext = '';
    if (dto.candidate_id) {
      try {
        const github = await getOrAnalyzeGitHub(dto.candidate_id);
        githubContext = `\n\nGitHub Intelligence (engineering maturity, not popularity):
Score: ${github.score}/100
Verdict: ${github.portfolioVerdict}
Summary: ${github.summary}
Top languages: ${github.languages.join(', ') || 'none'}
Highlights: ${github.highlights.join('; ') || 'none'}`;
      } catch {
        // Non-fatal: proceed without GitHub context if analysis fails.
      }
    }

    let parsed: CandidateEvaluationResult;
    try {
      parsed = await aiGenerateJSON<CandidateEvaluationResult>({
        prompt: `${systemPrompt}\n\nCandidate:\n${JSON.stringify(dto)}${githubContext}`,
        schema: evaluationSchema,
      });
    } catch (error) {
      console.error('AI evaluation failed:', error);
      throw new BadGatewayException(
        'AI evaluation is temporarily unavailable. Please try again shortly.',
      );
    }

    if (!isValidEvaluationResult(parsed)) {
      throw new BadGatewayException('AI provider returned an invalid evaluation payload.');
    }

    if (dto.candidate_id) {
      try {
        await supabase
          .from('candidates')
          .update({ ai_evaluation: parsed, ai_evaluated_at: new Date().toISOString() })
          .eq('id', dto.candidate_id);
        await logTimelineEvent(dto.candidate_id, 'ai_evaluated', `Score: ${parsed.score}`);
      } catch (error) {
        console.error('Failed to persist evaluation or timeline event:', error);
      }
    }

    return parsed;
  }
}
