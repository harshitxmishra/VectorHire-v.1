import { Interview, InterviewStatus } from '@/lib/types';

export type CreateInterviewData = {
  candidate_id: number;
  interviewer_name: string;
  scheduled_date: string;
  duration_minutes: number;
  calendar_event_id?: string | null;
  meet_link?: string | null;
};

export type UpdateInterviewData = {
  status?: InterviewStatus;
  interviewer_name?: string;
  scheduled_date?: string;
  duration_minutes?: number;
  calendar_event_id?: string | null;
  meet_link?: string | null;
};

export interface InterviewRepository {
  findAll(): Promise<Interview[]>;
  findById(id: number): Promise<Interview | null>;
  findByCandidateId(candidateId: number): Promise<Interview[]>;
  create(data: CreateInterviewData): Promise<Interview>;
  updateStatus(id: number, status: 'completed' | 'cancelled'): Promise<Interview>;
  update(id: number, data: UpdateInterviewData): Promise<Interview>;
  delete(id: number): Promise<void>;
}
