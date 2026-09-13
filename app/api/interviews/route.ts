import { NextResponse } from 'next/server';
import { getInterviews, getInterviewsByCandidateId, createInterview } from '@/lib/services/interview-service';
import { validateInterviewInput } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateIdParam = searchParams.get('candidateId');
    if (candidateIdParam !== null) {
      const candidateId = Number(candidateIdParam);
      if (!Number.isFinite(candidateId) || candidateId <= 0) {
        return NextResponse.json({ error: 'Invalid candidateId. Must be a positive integer.' }, { status: 400 });
      }
      const interviews = await getInterviewsByCandidateId(candidateId);
      return NextResponse.json(interviews);
    }
    const interviews = await getInterviews();
    return NextResponse.json(interviews);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load interviews.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateInterviewInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const interview = await createInterview(validation.data);
    return NextResponse.json(interview, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to schedule interview.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
