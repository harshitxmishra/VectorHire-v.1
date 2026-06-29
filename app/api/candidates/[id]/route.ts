import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { logTimelineEvent } from '@/lib/services/timeline-service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (typeof body?.status !== 'string') {
      return NextResponse.json({ error: 'status is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ status: body.status })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await logTimelineEvent(candidateId, 'status_changed', `Moved to ${body.status}`);

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update candidate.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 });
  }

  const { error } = await supabase.from('candidates').delete().eq('id', candidateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
