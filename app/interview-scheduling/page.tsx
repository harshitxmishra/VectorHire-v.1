'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, Badge, Button, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components';
import { VideoRegular, CheckmarkRegular, DismissRegular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { MonthCalendar } from '@/components/scheduling/MonthCalendar';
import { ScheduleInterviewDrawer } from '@/components/scheduling/ScheduleInterviewDrawer';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useCallback, useEffect, useState } from 'react';
import { Candidate, Interview } from '@/lib/types';

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: { marginBottom: tokens.spacingVerticalM, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingVerticalXL, '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' } },
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
  actions: { display: 'flex', gap: tokens.spacingHorizontalS },
});

export default function InterviewSchedulingPage() {
  const styles = useStyles();
  const notify = useAppToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [interviewsRes, candidatesRes] = await Promise.all([
        fetch('/api/interviews'),
        fetch('/api/candidates'),
      ]);
      const interviewsBody = await interviewsRes.json();
      const candidatesBody = await candidatesRes.json();
      setInterviews(Array.isArray(interviewsBody) ? interviewsBody : []);
      setCandidates(Array.isArray(candidatesBody) ? candidatesBody : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (interview: Interview, status: 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update interview.');
      notify(`Interview marked ${status}.`, 'success');
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update interview.', 'error');
    }
  };

  const today = new Date().toDateString();
  const scheduled = interviews.filter((i) => i.status === 'scheduled');
  const todaysInterviews = scheduled.filter((i) => new Date(i.scheduled_date).toDateString() === today);
  const upcoming = scheduled.filter((i) => new Date(i.scheduled_date).toDateString() !== today);
  const completed = interviews.filter((i) => i.status === 'completed');
  const cancelled = interviews.filter((i) => i.status === 'cancelled');

  const renderInterview = (interview: Interview, actionable: boolean) => (
    <div key={interview.id} className={styles.item}>
      <div>
        <div className={styles.name}>{interview.candidates?.full_name ?? 'Unknown candidate'}</div>
        <div className={styles.meta}>
          {new Date(interview.scheduled_date).toLocaleString()} • {interview.duration_minutes}min •{' '}
          {interview.interviewer_name}
        </div>
      </div>
      <div className={styles.actions}>
        {interview.meet_link ? (
          <Button appearance="secondary" size="small" icon={<VideoRegular />} onClick={() => window.open(interview.meet_link!, '_blank')}>
            Meet
          </Button>
        ) : null}
        <Badge
          appearance="tint"
          color={interview.status === 'completed' ? 'success' : interview.status === 'cancelled' ? 'danger' : 'informative'}
        >
          {interview.status}
        </Badge>
        {actionable ? (
          <>
            <Button appearance="subtle" size="small" icon={<CheckmarkRegular />} onClick={() => updateStatus(interview, 'completed')} />
            <Button appearance="subtle" size="small" icon={<DismissRegular />} onClick={() => updateStatus(interview, 'cancelled')} />
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Interview Scheduling</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <div className={styles.grid}>
          <ChartContainer title="Calendar" subtitle="Click any date to schedule an interview">
            {loading ? <p>Loading...</p> : (
              <MonthCalendar
                interviews={interviews}
                onDayClick={(date) => {
                  setSelectedDate(date);
                  setDrawerOpen(true);
                }}
              />
            )}
          </ChartContainer>

          <ChartContainer title="Today's Interviews" subtitle={`${todaysInterviews.length} scheduled today`}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {todaysInterviews.length === 0 ? <p>No interviews today.</p> : todaysInterviews.map((i) => renderInterview(i, true))}
            </div>
          </ChartContainer>
        </div>

        <ChartContainer title="Upcoming Interviews">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {upcoming.length === 0 ? <p>No upcoming interviews.</p> : upcoming.map((i) => renderInterview(i, true))}
          </div>
        </ChartContainer>

        <div className={styles.grid}>
          <ChartContainer title="Completed">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {completed.length === 0 ? <p>None yet.</p> : completed.map((i) => renderInterview(i, false))}
            </div>
          </ChartContainer>
          <ChartContainer title="Cancelled">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {cancelled.length === 0 ? <p>None.</p> : cancelled.map((i) => renderInterview(i, false))}
            </div>
          </ChartContainer>
        </div>
      </div>

      <ScheduleInterviewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultDate={selectedDate}
        candidates={candidates}
        onScheduled={() => {
          notify('Interview scheduled.', 'success');
          load();
        }}
      />
    </MainLayout>
  );
}
