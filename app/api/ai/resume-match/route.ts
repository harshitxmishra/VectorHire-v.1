import { NextResponse } from 'next/server';
import { extractTextFromBase64 } from '@/lib/services/resume-service';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';

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
  required: ['matchPercentage', 'matchedSkills', 'missingSkills', 'experienceMatch', 'educationMatch', 'recommendation'],
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobDescription = (formData.get('jobDescription') as string | null) ?? '';

    if (!file || !jobDescription.trim()) {
      return NextResponse.json({ error: 'A PDF file and job description are required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const resumeText = await extractTextFromBase64(base64, 'application/pdf');

    const parsed = await aiGenerateJSON({
      prompt: `Compare this resume against the job description. Score matchPercentage 0-100, list matchedSkills and missingSkills, give experienceMatch, educationMatch, and a recommendation.

Job Description:
${jobDescription}

Resume:
${resumeText}`,
      schema: matchSchema,
    });

    return NextResponse.json({ ...(parsed as object), resumeText });
  } catch (error) {
    console.error('Resume match failed:', error);
    return NextResponse.json(
      { error: 'Resume matching is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}
