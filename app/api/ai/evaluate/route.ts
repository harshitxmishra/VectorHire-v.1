import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { runHiringCommittee } from '@/lib/services/hiring-committee';

type CandidateEvaluationInput = {
  candidate_id?: number;
  full_name: string;
  college?: string;
  cgpa?: number;
  github?: string;
  status?: string;
  ai_score?: number;
};

function isValidCandidateInput(body: unknown): body is CandidateEvaluationInput {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.full_name === 'string' &&
    candidate.full_name.trim().length > 0
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;

    if (!isValidCandidateInput(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const force = (body as Record<string, unknown>).force === true;

    // Cache: check if already evaluated
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

    let candidateRecord: any = null;
    if (body.candidate_id) {
      try {
        const { data: cand } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', body.candidate_id)
          .single();
        candidateRecord = cand;
      } catch {
        // Non-fatal
      }
    }

    const result = await runHiringCommittee({
      candidate_id: body.candidate_id,
      full_name: body.full_name,
      college: body.college ?? candidateRecord?.college ?? 'Unknown',
      cgpa: body.cgpa ?? candidateRecord?.cgpa ?? 0,
      github: body.github ?? candidateRecord?.github ?? null,
      status: body.status ?? candidateRecord?.status ?? 'Applied',
      resume_text: candidateRecord?.resume_text,
      best_ai_project: candidateRecord?.best_ai_project,
      research_work: candidateRecord?.research_work,
      force,
    });

    return NextResponse.json(result);
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
