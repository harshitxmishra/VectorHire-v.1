import { NextResponse } from 'next/server';
import { getTimeline } from '@/lib/services/timeline-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 });
  }

  try {
    const timeline = await getTimeline(candidateId);
    return NextResponse.json(timeline);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load timeline.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
