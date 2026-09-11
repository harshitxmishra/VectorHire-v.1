import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { sendCandidateEmail, EmailType } from '@/lib/services/email-service';
import { validateEmailSendInput } from '@/lib/validation/schemas';

const STATUS_AFTER_SEND: Record<EmailType, string | null> = {
  assessment: 'Assessment Sent',
  offer: 'Offer Extended',
  interview: null, // interview emails are sent as part of scheduling, not bulk-status-changing
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateEmailSendInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const { candidateIds, type, force, assessmentTitle, assessmentDeadline, assessmentUrl, recruiterName } =
      validation.data;

    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, full_name, email')
      .in('id', candidateIds);

    if (error || !candidates) {
      return NextResponse.json({ error: error?.message ?? 'Candidates not found.' }, { status: 500 });
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
          return { candidateId: candidate.id, status: 'skipped' as const, error: 'Already sent.' };
        }

        const result = await sendCandidateEmail(candidate.id, type, candidate.email, candidate.full_name, {
          assessmentTitle,
          assessmentDeadline,
          assessmentUrl,
          recruiterName,
        });

        if (result.status === 'sent' && STATUS_AFTER_SEND[type]) {
          await supabase.from('candidates').update({ status: STATUS_AFTER_SEND[type] }).eq('id', candidate.id);
        }

        return { candidateId: candidate.id, ...result };
      })
    );

    return NextResponse.json({
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send emails.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
