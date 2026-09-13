import { NextResponse } from 'next/server';
import { getRecentTimelineEvents } from '@/lib/services/timeline-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 20;
    const events = await getRecentTimelineEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load timeline events.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
