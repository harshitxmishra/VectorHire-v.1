import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import { upsertJobMatch } from '@/lib/services/job-match-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { getJobDescriptionById } from '@/lib/services/job-description-service';

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
    const jobDescriptionId = Number(body?.job_description_id);
    const force = Boolean(body?.force);
    const candidateIds: number[] | undefined = Array.isArray(body?.candidate_ids)
      ? body.candidate_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : undefined;

    if (!Number.isFinite(jobDescriptionId) || jobDescriptionId <= 0) {
      return NextResponse.json(
        { error: 'job_description_id is required and must be a positive integer.' },
        { status: 400 }
      );
    }

    const jobDescription = await getJobDescriptionById(jobDescriptionId);
    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description not found.' }, { status: 404 });
    }

    let candidateQuery = supabase.from('candidates').select('*');
    if (candidateIds && candidateIds.length > 0) {
      candidateQuery = candidateQuery.in('id', candidateIds);
    }

    const { data: candidates, error: candidateErr } = await candidateQuery;
    if (candidateErr) {
      throw new Error(`Failed to load candidates: ${candidateErr.message}`);
    }

    let targets = candidates ?? [];

    if (!force) {
      const { data: existingMatches } = await supabase
        .from('job_match_results')
        .select('candidate_id')
        .eq('job_description_id', jobDescriptionId);

      const matchedSet = new Set((existingMatches ?? []).map((m) => m.candidate_id));
      targets = targets.filter((c) => !matchedSet.has(c.id));
    }

    let evaluatedCount = 0;

    for (const candidate of targets) {
      try {
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

        if (isValidMatchResult(parsed)) {
          await upsertJobMatch({
            candidate_id: candidate.id,
            job_description_id: jobDescriptionId,
            match_percentage: parsed.matchPercentage,
            matched_skills: parsed.matchedSkills,
            missing_skills: parsed.missingSkills,
            experience_match: parsed.experienceMatch,
            education_match: parsed.educationMatch,
            recommendation: parsed.recommendation,
          });

          await logTimelineEvent(candidate.id, 'jd_matched', `${parsed.matchPercentage}% match`);
          evaluatedCount++;
        }
      } catch (err) {
        // Continue processing other candidates
        console.error(`Match failed for candidate ${candidate.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      evaluated: evaluatedCount,
      totalTargets: targets.length,
      jobDescriptionId,
    });
  } catch (error) {
    console.error('Job match run failed:', error);
    const message = error instanceof Error ? error.message : 'Job matching failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
