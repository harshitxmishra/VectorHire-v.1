import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import { getOrAnalyzeGitHub } from '@/lib/services/github-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';

type CandidateEvaluationInput = {
  candidate_id?: number;
  full_name: string;
  college: string;
  cgpa: number;
  github: string;
  status: string;
  ai_score: number;
};

type CandidateEvaluationResult = {
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
  required: ['score', 'summary', 'strengths', 'weaknesses', 'recommendation', 'interviewQuestions'],
};

function isValidCandidateInput(body: unknown): body is CandidateEvaluationInput {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.full_name === 'string' &&
    typeof candidate.college === 'string' &&
    typeof candidate.cgpa === 'number' &&
    Number.isFinite(candidate.cgpa) &&
    typeof candidate.github === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.ai_score === 'number' &&
    Number.isFinite(candidate.ai_score)
  );
}

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    if (!isValidCandidateInput(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const force = (body as Record<string, unknown>).force === true;

    // Cache: never re-run AI for a candidate that already has an evaluation,
    // unless the recruiter explicitly requests "Re-evaluate".
    if (body.candidate_id && !force) {
      const { data: cached } = await supabase
        .from('candidates')
        .select('ai_evaluation')
        .eq('id', body.candidate_id)
        .single();

      if (cached?.ai_evaluation) {
        return NextResponse.json(cached.ai_evaluation);
      }
    }

    let githubContext = '';
    if (body.candidate_id) {
      try {
        const github = await getOrAnalyzeGitHub(body.candidate_id);
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

    const parsed = await aiGenerateJSON<CandidateEvaluationResult>({
      prompt: `${systemPrompt}

Candidate:
${JSON.stringify(body)}${githubContext}`,
      schema: evaluationSchema,
    });

    if (!isValidEvaluationResult(parsed)) {
      throw new Error('AI provider returned an invalid evaluation payload.');
    }

    if (body.candidate_id) {
      await supabase
        .from('candidates')
        .update({ ai_evaluation: parsed, ai_evaluated_at: new Date().toISOString() })
        .eq('id', body.candidate_id);
      await logTimelineEvent(body.candidate_id, 'ai_evaluated', `Score: ${parsed.score}`);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Never expose raw provider/API errors to the recruiter.
    console.error('AI evaluation failed:', error);
    return NextResponse.json(
      { error: 'AI evaluation is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}
