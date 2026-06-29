import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getDistinctCandidateIdsForEvent } from '@/lib/services/timeline-service';
import { getBestMatchPerCandidate } from '@/lib/services/job-match-service';

export interface AssessmentQueueItem {
  id: number;
  full_name: string;
  email: string;
  college: string;
  ai_score: number;
  jd_match_percentage: number | null;
  status: string;
  assessment_status: 'Not Sent' | 'Assessment Sent' | 'Assessment Failed' | 'Assessment Completed' | 'Interview Eligible';
  test_la: number | null;
  test_code: number | null;
  overall_score: number | null;
  last_email_sent_at: string | null;
}

export async function GET() {
  try {
    const [{ data: candidates, error: candidatesError }, evaluatedIds, bestMatches, { data: emailLogs }] =
      await Promise.all([
        supabase
          .from('candidates')
          .select(
            'id, full_name, email, college, ai_score, status, resume_url, parsing_status, test_la, test_code'
          ),
        getDistinctCandidateIdsForEvent('ai_evaluated'),
        getBestMatchPerCandidate(),
        supabase
          .from('email_logs')
          .select('candidate_id, status, sent_at, created_at')
          .eq('email_type', 'assessment')
          .order('created_at', { ascending: false }),
      ]);

    if (candidatesError) throw new Error(candidatesError.message);

    const latestEmailByCandidate = new Map<number, { status: string; sent_at: string | null }>();
    (emailLogs ?? []).forEach((log) => {
      if (!latestEmailByCandidate.has(log.candidate_id)) {
        latestEmailByCandidate.set(log.candidate_id, { status: log.status, sent_at: log.sent_at });
      }
    });

    const eligible = (candidates ?? []).filter(
      (c) => (!c.resume_url || c.parsing_status === 'success') && evaluatedIds.has(c.id)
    );

    const queue: AssessmentQueueItem[] = eligible.map((c) => {
      const overallScore =
        c.test_la !== null && c.test_code !== null ? Math.round((c.test_la + c.test_code) / 2) : null;
      const lastEmail = latestEmailByCandidate.get(c.id);

      let assessmentStatus: AssessmentQueueItem['assessment_status'] = 'Not Sent';
      if (c.status === 'Interview Eligible') assessmentStatus = 'Interview Eligible';
      else if (c.status === 'Assessment Completed') assessmentStatus = 'Assessment Completed';
      else if (lastEmail?.status === 'sent') assessmentStatus = 'Assessment Sent';
      else if (lastEmail?.status === 'failed') assessmentStatus = 'Assessment Failed';

      return {
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        college: c.college,
        ai_score: c.ai_score,
        jd_match_percentage: bestMatches[c.id] ?? null,
        status: c.status,
        assessment_status: assessmentStatus,
        test_la: c.test_la,
        test_code: c.test_code,
        overall_score: overallScore,
        last_email_sent_at: lastEmail?.sent_at ?? null,
      };
    });

    return NextResponse.json(queue);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load assessment queue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
