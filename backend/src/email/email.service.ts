import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import { sendCandidateEmail, EmailType } from '@/lib/services/email-service';
import { SendEmailDto } from './dto/send-email.dto';

const STATUS_AFTER_SEND: Record<EmailType, string | null> = {
  assessment: 'Assessment Sent',
  offer: 'Offer Extended',
  interview: null,
};

export interface SendEmailResponse {
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    candidateId: number;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
  }>;
}

@Injectable()
export class EmailService {
  async sendEmails(dto: SendEmailDto): Promise<SendEmailResponse> {
    const {
      candidateIds,
      type,
      force,
      assessmentTitle,
      assessmentDeadline,
      assessmentUrl,
      recruiterName,
    } = dto;

    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, full_name, email')
      .in('id', candidateIds);

    if (error || !candidates) {
      throw new InternalServerErrorException(error?.message ?? 'Candidates not found.');
    }

    let alreadySentIds = new Set<number>();
    if (!force) {
      const { data: existingSent } = await supabase
        .from('email_logs')
        .select('candidate_id')
        .eq('email_type', type)
        .eq('status', 'sent')
        .in('candidate_id', candidateIds);
      alreadySentIds = new Set((existingSent ?? []).map((r) => r.candidate_id));
    }

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        if (alreadySentIds.has(candidate.id)) {
          return {
            candidateId: candidate.id,
            status: 'skipped' as const,
            error: 'Already sent.',
          };
        }

        const result = await sendCandidateEmail(
          candidate.id,
          type,
          candidate.email,
          candidate.full_name,
          {
            assessmentTitle,
            assessmentDeadline,
            assessmentUrl,
            recruiterName,
          },
        );

        if (result.status === 'sent' && STATUS_AFTER_SEND[type]) {
          await supabase
            .from('candidates')
            .update({ status: STATUS_AFTER_SEND[type] })
            .eq('id', candidate.id);
        }

        return { candidateId: candidate.id, ...result };
      }),
    );

    return {
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    };
  }
}
