import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { generateIcsInvite } from '@/lib/services/calendar-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const interviewId = Number(id);

    if (!Number.isFinite(interviewId) || interviewId <= 0) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }

    const { data: interview, error } = await supabase
      .from('interviews')
      .select('*, candidates(full_name, email)')
      .eq('id', interviewId)
      .single();

    if (error || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const candidate = Array.isArray(interview.candidates)
      ? interview.candidates[0]
      : interview.candidates;

    const candidateName = candidate?.full_name || 'Candidate';
    const candidateEmail = candidate?.email || 'candidate@vectorhire.ai';
    const interviewerName = interview.interviewer_name || 'Technical Interviewer';
    const meetLink = interview.meet_link || 'https://meet.jit.si/vectorhire-interview';

    const icsContent = generateIcsInvite({
      eventId: interview.calendar_event_id || `interview-${interview.id}`,
      summary: `Interview: ${candidateName} with ${interviewerName}`,
      description: `VectorHire Interview\nCandidate: ${candidateName}\nInterviewer: ${interviewerName}\nLink: ${meetLink}`,
      startTime: new Date(interview.scheduled_date),
      durationMinutes: interview.duration_minutes || 60,
      meetLink,
      candidateName,
      candidateEmail,
      interviewerName,
      interviewerEmail: 'interviewer@vectorhire.ai',
    });

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="interview-${interviewId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate calendar invite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
