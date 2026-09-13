import { supabase } from '@/lib/supabase/client';
import { EmailLog } from '@/lib/types';
import {
  EmailLogRepository,
  CreateEmailLogData,
  EmailLogType,
} from './email-log-repository';

export class SupabaseEmailLogRepository implements EmailLogRepository {
  async create(input: CreateEmailLogData): Promise<EmailLog> {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        candidate_id: input.candidate_id,
        email_type: input.email_type,
        recipient: input.recipient,
        status: input.status ?? 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error creating email log: ${error.message}`);
    }

    return data;
  }

  async markAsSent(id: number, sentAt?: string): Promise<void> {
    const { error } = await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: sentAt ?? new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error marking email log ${id} as sent: ${error.message}`);
    }
  }

  async markAsFailed(id: number, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('email_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error marking email log ${id} as failed: ${error.message}`);
    }
  }

  async findSentCandidateIds(candidateIds: number[], emailType: EmailLogType): Promise<number[]> {
    if (candidateIds.length === 0) return [];

    const { data, error } = await supabase
      .from('email_logs')
      .select('candidate_id')
      .eq('email_type', emailType)
      .eq('status', 'sent')
      .in('candidate_id', candidateIds);

    if (error) {
      throw new Error(`Database error fetching sent email logs: ${error.message}`);
    }

    return (data ?? []).map((row) => row.candidate_id);
  }

  async findByCandidateId(candidateId: number): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching email logs for candidate ${candidateId}: ${error.message}`);
    }

    return data ?? [];
  }

  async findByType(emailType: EmailLogType): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('email_type', emailType)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching email logs by type ${emailType}: ${error.message}`);
    }

    return data ?? [];
  }
}
