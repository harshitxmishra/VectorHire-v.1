import { NextResponse } from 'next/server';
import { getInterviews, createInterview } from '@/lib/services/interview-service';

export async function GET() {
  try {
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

    if (
      typeof body?.candidate_id !== 'number' ||
      typeof body?.interviewer_name !== 'string' ||
      typeof body?.scheduled_date !== 'string'
    ) {
      return NextResponse.json(
        { error: 'candidate_id, interviewer_name, and scheduled_date are required.' },
        { status: 400 }
      );
    }

    const interview = await createInterview({
      candidate_id: body.candidate_id,
      interviewer_name: body.interviewer_name,
      scheduled_date: body.scheduled_date,
      duration_minutes: typeof body.duration_minutes === 'number' ? body.duration_minutes : 60,
    });

    return NextResponse.json(interview);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to schedule interview.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
