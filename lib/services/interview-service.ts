import { supabase } from '@/lib/supabase/client';
import { Interview } from '@/lib/types';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/services/calendar-service';
import { sendCandidateEmail } from '@/lib/services/email-service';

export async function getInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*, candidates(full_name, email)')
    .order('scheduled_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface CreateInterviewInput {
  candidate_id: number;
  interviewer_name: string;
  scheduled_date: string;
  duration_minutes: number;
}

export async function createInterview(input: CreateInterviewInput): Promise<Interview> {
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('id, full_name, email')
    .eq('id', input.candidate_id)
    .single();

  if (candidateError || !candidate) throw new Error('Candidate not found.');

  const { calendarEventId, meetLink } = await createCalendarEvent({
    candidateName: candidate.full_name,
    interviewerName: input.interviewer_name,
    startTime: new Date(input.scheduled_date),
    durationMinutes: input.duration_minutes,
  });

  const { data, error } = await supabase
    .from('interviews')
    .insert({ ...input, calendar_event_id: calendarEventId, meet_link: meetLink })
    .select('*, candidates(full_name, email)')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('candidates').update({ status: 'Interview Scheduled' }).eq('id', input.candidate_id);
  await logTimelineEvent(
    input.candidate_id,
    'interview_scheduled',
    `Interview with ${input.interviewer_name} on ${new Date(input.scheduled_date).toLocaleString()}`
  );

  await sendCandidateEmail(input.candidate_id, 'interview', candidate.email, candidate.full_name, {
    interviewDate: new Date(input.scheduled_date).toLocaleString(),
    meetLink: meetLink ?? undefined,
  });

  return data;
}

export async function updateInterviewStatus(
  id: number,
  status: 'completed' | 'cancelled'
): Promise<Interview> {
  const { data, error } = await supabase
    .from('interviews')
    .update({ status })
    .eq('id', id)
    .select('*, candidates(full_name, email)')
    .single();

  if (error) throw new Error(error.message);

  if (status === 'completed') {
    await supabase.from('candidates').update({ status: 'Interview Completed' }).eq('id', data.candidate_id);
    await logTimelineEvent(data.candidate_id, 'interview_completed');
  }

  if (status === 'cancelled' && data.calendar_event_id) {
    await deleteCalendarEvent(data.calendar_event_id);
  }

  return data;
}
