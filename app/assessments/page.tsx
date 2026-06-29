'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  MessageBar,
  MessageBarBody,
  Badge,
  Button,
  Input,
  Field,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { MailRegular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useCallback, useEffect, useState } from 'react';
import type { AssessmentQueueItem } from '@/app/api/assessments/queue/route';

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: { marginBottom: tokens.spacingVerticalM },
  formRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    marginBottom: tokens.spacingVerticalM,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  name: { fontWeight: 600, color: tokens.colorNeutralForeground1 },
  meta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
});

const STATUS_COLOR: Record<AssessmentQueueItem['assessment_status'], 'subtle' | 'informative' | 'danger' | 'success' | 'brand'> = {
  'Not Sent': 'subtle',
  'Assessment Sent': 'informative',
  'Assessment Failed': 'danger',
  'Assessment Completed': 'success',
  'Interview Eligible': 'brand',
};

export default function AssessmentsPage() {
  const styles = useStyles();
  const notify = useAppToast();
  const [queue, setQueue] = useState<AssessmentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const [assessmentTitle, setAssessmentTitle] = useState('Technical Assessment');
  const [assessmentDeadline, setAssessmentDeadline] = useState('');
  const [assessmentUrl, setAssessmentUrl] = useState('');
  const [recruiterName, setRecruiterName] = useState('VectorHire Recruiting Team');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/assessments/queue');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to load assessment queue.');
      setQueue(Array.isArray(body) ? body : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendAssessment = async (candidateId: number) => {
    setSendingId(candidateId);
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: [candidateId],
          type: 'assessment',
          assessmentTitle,
          assessmentDeadline,
          assessmentUrl,
          recruiterName,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to send assessment.');

      if (body.skipped > 0) {
        notify('Assessment was already sent to this candidate.', 'info');
      } else if (body.sent > 0) {
        notify('Assessment email sent.', 'success');
      } else {
        notify('Assessment email failed to send.', 'error');
      }
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to send assessment.', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Assessments</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer
          title="Assessment Queue"
          subtitle="All candidates — send an assessment link directly from here"
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            <div className={styles.formRow}>
              <Field label="Assessment Title">
                <Input value={assessmentTitle} onChange={(_, d) => setAssessmentTitle(d.value)} />
              </Field>
              <Field label="Deadline">
                <Input
                  type="date"
                  value={assessmentDeadline}
                  onChange={(_, d) => setAssessmentDeadline(d.value)}
                />
              </Field>
              <Field label="Assessment Link">
                <Input
                  placeholder="https://..."
                  value={assessmentUrl}
                  onChange={(_, d) => setAssessmentUrl(d.value)}
                />
              </Field>
              <Field label="Recruiter Name">
                <Input value={recruiterName} onChange={(_, d) => setRecruiterName(d.value)} />
              </Field>
            </div>

            {loading ? (
              <p>Loading assessment queue...</p>
            ) : queue.length === 0 ? (
              <p>No candidates yet. Upload a dataset from the Candidates page first.</p>
            ) : (
              queue.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div>
                    <div className={styles.name}>{item.full_name}</div>
                    <div className={styles.meta}>
                      {item.college} • AI score {item.ai_score}
                      {item.jd_match_percentage !== null ? ` • JD match ${item.jd_match_percentage}%` : ''}
                      {item.overall_score !== null ? ` • Assessment score ${item.overall_score}%` : ''}
                      {item.last_email_sent_at ? ` • Sent ${new Date(item.last_email_sent_at).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <Badge appearance="tint" color={STATUS_COLOR[item.assessment_status]}>
                      {item.assessment_status}
                    </Badge>
                    <Button
                      appearance="secondary"
                      size="small"
                      icon={<MailRegular />}
                      disabled={sendingId === item.id || item.assessment_status === 'Assessment Sent'}
                      onClick={() => sendAssessment(item.id)}
                    >
                      {sendingId === item.id ? 'Sending...' : 'Send Assessment'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
