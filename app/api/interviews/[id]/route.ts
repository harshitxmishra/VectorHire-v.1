import { NextResponse } from 'next/server';
import { updateInterviewStatus } from '@/lib/services/interview-service';
import { validateInterviewStatus } from '@/lib/validation/schemas';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interviewId = Number(id);

  if (!Number.isFinite(interviewId) || interviewId <= 0) {
    return NextResponse.json({ error: 'Invalid interview id. Must be a positive integer.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = validateInterviewStatus(body?.status);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const interview = await updateInterviewStatus(interviewId, validation.data);
    return NextResponse.json(interview);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update interview.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
