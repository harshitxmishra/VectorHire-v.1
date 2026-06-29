import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import { upsertJobMatch } from '@/lib/services/job-match-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';

type MatchResult = {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  educationMatch: string;
  recommendation: string;
};

const matchSchema: AISchema = {
  type: 'object',
  properties: {
    matchPercentage: { type: 'number', minimum: 0, maximum: 100 },
    matchedSkills: { type: 'array', items: { type: 'string' } },
    missingSkills: { type: 'array', items: { type: 'string' } },
    experienceMatch: { type: 'string' },
    educationMatch: { type: 'string' },
    recommendation: { type: 'string' },
  },
  required: [
    'matchPercentage',
    'matchedSkills',
    'missingSkills',
    'experienceMatch',
    'educationMatch',
    'recommendation',
  ],
};

function isValidMatchResult(value: unknown): value is MatchResult {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.matchPercentage === 'number' &&
    Array.isArray(r.matchedSkills) &&
    Array.isArray(r.missingSkills) &&
    typeof r.experienceMatch === 'string' &&
    typeof r.educationMatch === 'string' &&
    typeof r.recommendation === 'string'
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = Number(body?.candidate_id);
    const jobDescriptionId = Number(body?.job_description_id);

    if (!Number.isFinite(candidateId) || !Number.isFinite(jobDescriptionId)) {
      return NextResponse.json(
        { error: 'candidate_id and job_description_id are required.' },
        { status: 400 }
      );
    }

    const [{ data: candidate, error: candidateError }, { data: jobDescription, error: jdError }] =
      await Promise.all([
        supabase.from('candidates').select('*').eq('id', candidateId).single(),
        supabase.from('job_descriptions').select('*').eq('id', jobDescriptionId).single(),
      ]);

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    if (jdError || !jobDescription) {
      return NextResponse.json({ error: 'Job description not found.' }, { status: 404 });
    }

    // Token optimization: only the fields actually relevant to a JD match
    // are sent — no raw timestamps, ids, or unrelated columns.
    const prompt = `You are a technical recruiter comparing a candidate against a job description.

Job Description: ${jobDescription.title}
Requirements:
${jobDescription.requirements}

Candidate:
Name: ${candidate.full_name}
Skills/Branch: ${candidate.branch ?? 'Unknown'}
Best AI Project: ${candidate.best_ai_project ?? 'None provided'}
Research Work: ${candidate.research_work ?? 'None provided'}
GitHub: ${candidate.github ?? 'None provided'}
Resume: ${candidate.resume_text ?? 'Not available'}
Aptitude Score: ${candidate.test_la ?? 'Not taken'}
Coding Score: ${candidate.test_code ?? 'Not taken'}

Evaluate how well this candidate matches the job description. Score matchPercentage from 0-100.
List matchedSkills (skills/requirements the candidate clearly satisfies) and missingSkills (requirements not evidenced).
Give a short experienceMatch and educationMatch assessment, and an overall recommendation.`;

    const parsed = await aiGenerateJSON<MatchResult>({ prompt, schema: matchSchema });

    if (!isValidMatchResult(parsed)) {
      throw new Error('AI provider returned an invalid match payload.');
    }

    await upsertJobMatch({
      candidate_id: candidateId,
      job_description_id: jobDescriptionId,
      match_percentage: parsed.matchPercentage,
      matched_skills: parsed.matchedSkills,
      missing_skills: parsed.missingSkills,
      experience_match: parsed.experienceMatch,
      education_match: parsed.educationMatch,
      recommendation: parsed.recommendation,
    });

    await logTimelineEvent(candidateId, 'jd_matched', `${parsed.matchPercentage}% match`);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI match failed:', error);
    return NextResponse.json(
      { error: 'JD matching is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}
