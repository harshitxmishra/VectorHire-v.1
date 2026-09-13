import { Interview } from '@/lib/types';
import { InterviewRepository } from '@/lib/repositories/interview-repository';
import { SupabaseInterviewRepository } from '@/lib/repositories/supabase-interview-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/services/calendar-service';
import { sendCandidateEmail } from '@/lib/services/email-service';

const defaultInterviewRepository: InterviewRepository = new SupabaseInterviewRepository();
const defaultCandidateRepository: CandidateRepository = new SupabaseCandidateRepository();

export async function getInterviews(
  repo: InterviewRepository = defaultInterviewRepository
): Promise<Interview[]> {
  return repo.findAll();
}

export async function getInterviewsByCandidateId(
  candidateId: number,
  repo: InterviewRepository = defaultInterviewRepository
): Promise<Interview[]> {
  return repo.findByCandidateId(candidateId);
}

export interface CreateInterviewInput {
  candidate_id: number;
  interviewer_name: string;
  scheduled_date: string;
  duration_minutes: number;
}

export async function createInterview(
  input: CreateInterviewInput,
  repo: InterviewRepository = defaultInterviewRepository,
  candidateRepo: CandidateRepository = defaultCandidateRepository
): Promise<Interview> {
  const candidate = await candidateRepo.findById(input.candidate_id);
  if (!candidate) {
    throw new Error('Candidate not found.');
  }

  const { calendarEventId, meetLink } = await createCalendarEvent({
    candidateName: candidate.full_name,
    interviewerName: input.interviewer_name,
    startTime: new Date(input.scheduled_date),
    durationMinutes: input.duration_minutes,
  });

  const interview = await repo.create({
    ...input,
    calendar_event_id: calendarEventId,
    meet_link: meetLink,
  });

  await candidateRepo.updateStatus(input.candidate_id, 'Interview Scheduled');
  await logTimelineEvent(
    input.candidate_id,
    'interview_scheduled',
    `Interview with ${input.interviewer_name} on ${new Date(input.scheduled_date).toLocaleString()}`
  );

  await sendCandidateEmail(input.candidate_id, 'interview', candidate.email, candidate.full_name, {
    interviewDate: new Date(input.scheduled_date).toLocaleString(),
    meetLink: meetLink ?? undefined,
  });

  return interview;
}

export async function updateInterviewStatus(
  id: number,
  status: 'completed' | 'cancelled',
  repo: InterviewRepository = defaultInterviewRepository,
  candidateRepo: CandidateRepository = defaultCandidateRepository
): Promise<Interview> {
  const interview = await repo.updateStatus(id, status);

  if (status === 'completed') {
    await candidateRepo.updateStatus(interview.candidate_id, 'Interview Completed');
    await logTimelineEvent(interview.candidate_id, 'interview_completed');
  }

  if (status === 'cancelled' && interview.calendar_event_id) {
    await deleteCalendarEvent(interview.calendar_event_id);
  }

  return interview;
}
