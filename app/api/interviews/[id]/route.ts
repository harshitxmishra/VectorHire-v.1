import { NextResponse } from 'next/server';
import { updateInterviewStatus } from '@/lib/services/interview-service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interviewId = Number(id);

  if (!Number.isFinite(interviewId)) {
    return NextResponse.json({ error: 'Invalid interview id.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (body?.status !== 'completed' && body?.status !== 'cancelled') {
      return NextResponse.json({ error: 'status must be completed or cancelled.' }, { status: 400 });
    }

    const interview = await updateInterviewStatus(interviewId, body.status);
    return NextResponse.json(interview);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update interview.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
