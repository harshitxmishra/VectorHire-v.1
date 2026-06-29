import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { upsertJobMatch } from '@/lib/services/job-match-service';

type MatchResult = {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  educationMatch: string;
  recommendation: string;
};

const matchSchema = {
  type: Type.OBJECT,
  properties: {
    matchPercentage: { type: Type.NUMBER, minimum: 0, maximum: 100 },
    matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experienceMatch: { type: Type.STRING },
    educationMatch: { type: Type.STRING },
    recommendation: { type: Type.STRING },
  },
  required: [
    'matchPercentage',
    'matchedSkills',
    'missingSkills',
    'experienceMatch',
    'educationMatch',
    'recommendation',
  ],
} as const;

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

function extractText(response: unknown): string {
  const r = response as { text?: string };
  if (typeof r.text === 'string' && r.text.trim()) return r.text.trim();
  throw new Error('Gemini returned no text content.');
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

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

    const prompt = `You are a technical recruiter comparing a candidate against a job description.

Job Description: ${jobDescription.title}
Requirements:
${jobDescription.requirements}

Candidate:
Name: ${candidate.full_name}
College: ${candidate.college}
Branch: ${candidate.branch ?? 'Unknown'}
CGPA: ${candidate.cgpa}
Best AI Project: ${candidate.best_ai_project ?? 'None provided'}
Research Work: ${candidate.research_work ?? 'None provided'}
GitHub: ${candidate.github ?? 'None provided'}
Resume text: ${candidate.resume_text ?? 'Not available'}
Logical Aptitude Score: ${candidate.test_la ?? 'Not taken'}
Coding Test Score: ${candidate.test_code ?? 'Not taken'}

Evaluate how well this candidate matches the job description. Score matchPercentage from 0-100.
List matchedSkills (skills/requirements the candidate clearly satisfies) and missingSkills (requirements not evidenced).
Give a short experienceMatch and educationMatch assessment, and an overall recommendation.
Return ONLY valid JSON.`;

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: matchSchema,
      },
    });

    const parsed = JSON.parse(extractText(response)) as unknown;

    if (!isValidMatchResult(parsed)) {
      throw new Error('Gemini returned an invalid match payload.');
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

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to match candidate.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
