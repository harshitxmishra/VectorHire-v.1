'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Badge,
  Button,
  Dropdown,
  Option,
  Title2,
  Title3,
  makeStyles,
  tokens,
  shorthands,
  TabList,
  Tab,
  Body1,
  Body2,
  Caption1,
  Spinner,
  ProgressBar,
  Input,
  Field,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
} from '@fluentui/react-components';
import {
  PersonRegular,
  DocumentTextRegular,
  CodeRegular,
  SparkleRegular,
  HistoryRegular,
  ArrowLeftRegular,
  ArrowSyncRegular,
  CalendarRegular,
  MailRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  OpenRegular,
  VideoRegular,
  CheckmarkRegular,
  DismissRegular,
  SendRegular,
  TagRegular,
} from '@fluentui/react-icons';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import {
  Candidate,
  AIEvaluationResult,
  GitHubIntelligence,
  TimelineEvent,
  Interview,
  EmailLog,
  PIPELINE_STAGES,
} from '@/lib/types';
import { safeParseApiResponse } from '@/lib/utils/api-client';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
  },
  headerProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  avatarBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    ...shorthands.border('2px', 'solid', '#818cf8'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    color: '#818cf8',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  intelligenceBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  metricCard: {
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: 700,
  },
  metricLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
  },
  subPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.08)'),
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  },
  infoLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  timelineItem: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: '12px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  },
  timelineIcon: {
    marginTop: '2px',
    color: '#818cf8',
    fontSize: '20px',
  },
  asyncStatusChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  interviewCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: '12px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.08)'),
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
  },
});

type JobState = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

function CandidateDetailContent() {
  const styles = useStyles();
  const params = useParams();
  const router = useRouter();
  const notify = useAppToast();
  const candidateId = Number(params?.id);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 5 Unified Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'interviews' | 'communication' | 'timeline'>('overview');
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'resume' | 'github' | 'ai'>('ai');

  // Async job states
  const [aiJobState, setAiJobState] = useState<JobState>('idle');
  const [resumeJobState, setResumeJobState] = useState<JobState>('idle');
  const [githubJobState, setGithubJobState] = useState<JobState>('idle');
  const [emailJobState, setEmailJobState] = useState<JobState>('idle');

  // Modals / Drawers
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  // Scheduling Form state
  const [scheduleInterviewer, setScheduleInterviewer] = useState('Senior Interviewer');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [savingInterview, setSavingInterview] = useState(false);

  // Assessment Email Form state
  const [assessmentTitle, setAssessmentTitle] = useState('Technical Assessment');
  const [assessmentDeadline, setAssessmentDeadline] = useState('7 days from receipt');
  const [assessmentUrl, setAssessmentUrl] = useState('https://assessments.vectorhire.internal/take');
  const [recruiterName, setRecruiterName] = useState('VectorHire Talent Team');
  const [sendingEmail, setSendingEmail] = useState(false);

  const loadCandidate = useCallback(async () => {
    if (!Number.isFinite(candidateId) || candidateId <= 0) {
      setError('Invalid Candidate ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`);
      const data = await safeParseApiResponse<Candidate>(res);
      setCandidate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading candidate');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  const loadTimeline = useCallback(async () => {
    if (!Number.isFinite(candidateId) || candidateId <= 0) return;
    try {
      const res = await fetch(`/api/candidates/${candidateId}/timeline`);
      if (res.ok) {
        const events = await safeParseApiResponse<TimelineEvent[]>(res);
        setTimeline(Array.isArray(events) ? events : []);
      }
    } catch {
      // Timeline retrieval failure is non-blocking
    }
  }, [candidateId]);

  const loadInterviews = useCallback(async () => {
    if (!Number.isFinite(candidateId) || candidateId <= 0) return;
    try {
      const res = await fetch(`/api/interviews?candidateId=${candidateId}`);
      if (res.ok) {
        const data = await safeParseApiResponse<Interview[]>(res);
        setInterviews(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-blocking
    }
  }, [candidateId]);

  const loadEmailLogs = useCallback(async () => {
    if (!Number.isFinite(candidateId) || candidateId <= 0) return;
    try {
      const res = await fetch(`/api/candidates/${candidateId}/emails`);
      if (res.ok) {
        const data = await safeParseApiResponse<EmailLog[]>(res);
        setEmailLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-blocking
    }
  }, [candidateId]);

  // Load all candidate state on mount / ID change
  useEffect(() => {
    loadCandidate();
    loadTimeline();
    loadInterviews();
    loadEmailLogs();
  }, [loadCandidate, loadTimeline, loadInterviews, loadEmailLogs]);

  // Refresh handler (data refresh only - no expensive reprocessing)
  const handleRefresh = async () => {
    await Promise.all([loadCandidate(), loadTimeline(), loadInterviews(), loadEmailLogs()]);
    notify('Candidate data refreshed', 'success');
  };

  // Handle Status Transition
  const handleStatusChange = async (newStatus: string) => {
    if (!candidate || candidate.status === newStatus) return;
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await safeParseApiResponse<Candidate>(res);
      setCandidate(updated);
      notify(`Status updated to ${newStatus}`, 'success');
      loadTimeline();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  // Run AI Evaluation with Bounded Polling
  const triggerAiEvaluation = async (force = false) => {
    if (!candidate) return;
    setAiJobState('queued');
    notify('Enqueued AI Candidate Evaluation', 'info');

    try {
      const res = await fetch('/api/v1/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          full_name: candidate.full_name,
          college: candidate.college,
          cgpa: candidate.cgpa,
          github: candidate.github ?? '',
          status: candidate.status,
          ai_score: candidate.ai_score,
          force,
        }),
      });

      const body = await safeParseApiResponse<{
        status?: string;
        result?: unknown;
        jobId?: string;
        error?: string;
      }>(res);

      if (body.status === 'completed' && body.result) {
        setAiJobState('completed');
        notify('AI Evaluation completed', 'success');
        await Promise.all([loadCandidate(), loadTimeline()]);
        return;
      }

      if (body.jobId) {
        setAiJobState('processing');
        let attempts = 0;
        const maxAttempts = 60;
        let finished = false;

        while (attempts < maxAttempts && !finished) {
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;

          const pollRes = await fetch(`/api/v1/ai/jobs/${body.jobId}`);
          if (pollRes.ok) {
            const pollData = await safeParseApiResponse<{
              state?: string;
              error?: string;
            }>(pollRes);
            if (pollData.state === 'completed') {
              finished = true;
              setAiJobState('completed');
              notify('AI Evaluation completed successfully', 'success');
              await Promise.all([loadCandidate(), loadTimeline()]);
            } else if (pollData.state === 'failed') {
              finished = true;
              setAiJobState('failed');
              notify(pollData.error || 'AI Evaluation failed', 'error');
            }
          }
        }

        if (!finished) {
          setAiJobState('idle');
          notify('AI Evaluation is processing in background.', 'info');
        }
      }
    } catch (err) {
      setAiJobState('failed');
      notify(err instanceof Error ? err.message : 'AI Evaluation failed', 'error');
    }
  };

  // Run Resume Parse with Bounded Polling
  const triggerResumeParse = async () => {
    if (!candidate?.resume_url) {
      notify('Candidate does not have a resume URL configured.', 'error');
      return;
    }
    setResumeJobState('queued');
    notify('Enqueued Resume Parsing', 'info');

    try {
      const res = await fetch(`/api/v1/candidates/${candidate.id}/parse-resume`, {
        method: 'POST',
      });
      const body = await safeParseApiResponse<{ jobId?: string; error?: string }>(res);

      if (body.jobId) {
        setResumeJobState('processing');
        let attempts = 0;
        const maxAttempts = 60;
        let finished = false;

        while (attempts < maxAttempts && !finished) {
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;

          const pollRes = await fetch(`/api/v1/resume/jobs/${body.jobId}`);
          if (pollRes.ok) {
            const pollData = await safeParseApiResponse<{ state?: string; error?: string }>(pollRes);
            if (pollData.state === 'completed') {
              finished = true;
              setResumeJobState('completed');
              notify('Resume parsed successfully', 'success');
              await Promise.all([loadCandidate(), loadTimeline()]);
            } else if (pollData.state === 'failed') {
              finished = true;
              setResumeJobState('failed');
              notify(pollData.error || 'Resume parsing failed', 'error');
            }
          }
        }
      }
    } catch (err) {
      setResumeJobState('failed');
      notify(err instanceof Error ? err.message : 'Resume parsing failed', 'error');
    }
  };

  // Run GitHub Analysis with Bounded Polling
  const triggerGithubAnalysis = async (force = false) => {
    if (!candidate?.github) {
      notify('Candidate does not have a GitHub handle configured.', 'error');
      return;
    }
    setGithubJobState('queued');
    notify('Enqueued GitHub Technical Analysis', 'info');

    try {
      const res = await fetch(`/api/v1/candidates/${candidate.id}/analyze-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const body = await safeParseApiResponse<{ jobId?: string; error?: string }>(res);

      if (body.jobId) {
        setGithubJobState('processing');
        let attempts = 0;
        const maxAttempts = 60;
        let finished = false;

        while (attempts < maxAttempts && !finished) {
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;

          const pollRes = await fetch(`/api/v1/github/jobs/${body.jobId}`);
          if (pollRes.ok) {
            const pollData = await safeParseApiResponse<{ state?: string; error?: string }>(pollRes);
            if (pollData.state === 'completed') {
              finished = true;
              setGithubJobState('completed');
              notify('GitHub analysis completed', 'success');
              await Promise.all([loadCandidate(), loadTimeline()]);
            } else if (pollData.state === 'failed') {
              finished = true;
              setGithubJobState('failed');
              notify(pollData.error || 'GitHub analysis failed', 'error');
            }
          }
        }
      }
    } catch (err) {
      setGithubJobState('failed');
      notify(err instanceof Error ? err.message : 'GitHub analysis failed', 'error');
    }
  };

  // Interview modal scheduling
  const handleCreateInterview = async () => {
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(hours || 10, minutes || 0, 0, 0);

    if (!candidate || !scheduleInterviewer.trim() || !scheduledDateTime) {
      notify('Interviewer name and valid date/time are required', 'error');
      return;
    }
    setSavingInterview(true);

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          interviewer_name: scheduleInterviewer.trim(),
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: scheduleDuration,
        }),
      });

      await safeParseApiResponse(res);

      notify('Interview scheduled successfully', 'success');
      setScheduleModalOpen(false);
      await Promise.all([loadCandidate(), loadInterviews(), loadTimeline(), loadEmailLogs()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to schedule interview.', 'error');
    } finally {
      setSavingInterview(false);
    }
  };

  // Interview status update
  const handleUpdateInterviewStatus = async (interviewId: number, newStatus: 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await safeParseApiResponse(res);
      notify(`Interview marked as ${newStatus}`, 'success');
      await Promise.all([loadCandidate(), loadInterviews(), loadTimeline()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update interview', 'error');
    }
  };

  // Dispatch Assessment Email
  const handleSendAssessmentEmail = async () => {
    if (!candidate) return;
    setSendingEmail(true);
    setEmailJobState('queued');
    notify('Dispatching assessment email...', 'info');

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: [candidate.id],
          type: 'assessment',
          assessmentTitle,
          assessmentDeadline,
          assessmentUrl,
          recruiterName,
        }),
      });

      await safeParseApiResponse(res);

      notify('Assessment email dispatched', 'success');
      setAssessmentModalOpen(false);
      setEmailJobState('completed');
      await Promise.all([loadCandidate(), loadEmailLogs(), loadTimeline()]);
    } catch (err) {
      setEmailJobState('failed');
      notify(err instanceof Error ? err.message : 'Failed to dispatch email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Dispatch Offer Email
  const handleSendOfferEmail = async () => {
    if (!candidate) return;
    setSendingEmail(true);
    setEmailJobState('queued');
    notify('Dispatching employment offer email...', 'info');

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: [candidate.id],
          type: 'offer',
          recruiterName,
        }),
      });

      await safeParseApiResponse(res);

      notify('Offer email dispatched successfully', 'success');
      setOfferModalOpen(false);
      setEmailJobState('completed');
      await Promise.all([loadCandidate(), loadEmailLogs(), loadTimeline()]);
    } catch (err) {
      setEmailJobState('failed');
      notify(err instanceof Error ? err.message : 'Failed to dispatch offer email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px', gap: '16px' }}>
          <Spinner label="Loading candidate workspace..." />
          <ProgressBar style={{ width: '240px' }} />
        </div>
      </MainLayout>
    );
  }

  if (error || !candidate) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.panel} style={{ alignItems: 'center', textAlign: 'center', padding: '64px' }}>
            <DismissCircleRegular style={{ fontSize: '48px', color: '#f87171' }} />
            <Title2>{error || 'Candidate Not Found'}</Title2>
            <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
              The requested candidate profile could not be loaded.
            </Body1>
            <Button appearance="primary" icon={<ArrowLeftRegular />} onClick={() => router.push('/candidates')}>
              Return to Directory
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const aiEval: AIEvaluationResult | undefined = candidate.ai_evaluation || undefined;
  const ghAnalysis: GitHubIntelligence | undefined = candidate.github_summary
    ? {
        score: candidate.github_score ?? 0,
        summary: candidate.github_summary,
        languages: candidate.github_languages ?? [],
        portfolioVerdict: candidate.github_portfolio_verdict ?? '',
        highlights: candidate.github_highlights ?? [],
        strongestRepo: candidate.github_strongest_repo ?? null,
      }
    : undefined;

  const initials = candidate.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/candidates" style={{ textDecoration: 'none' }}>
            <Button appearance="subtle" icon={<ArrowLeftRegular />}>
              Back to Directory
            </Button>
          </Link>
        </div>

        {/* Candidate Header Bar */}
        <div className={styles.header}>
          <div className={styles.headerProfile}>
            <div className={styles.avatarBadge}>{initials}</div>
            <div>
              <Title2>{candidate.full_name}</Title2>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                {candidate.email} &bull; {candidate.college || 'College Unspecified'}
                {candidate.branch ? ` &bull; ${candidate.branch}` : ''}
              </Caption1>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Dropdown
              value={candidate.status}
              selectedOptions={[candidate.status]}
              onOptionSelect={(_, data) => handleStatusChange(data.optionValue as string)}
              style={{ minWidth: '180px' }}
            >
              {PIPELINE_STAGES.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Dropdown>

            <Button appearance="primary" icon={<CalendarRegular />} onClick={() => setScheduleModalOpen(true)}>
              Schedule Interview
            </Button>

            <Button appearance="secondary" icon={<MailRegular />} onClick={() => setAssessmentModalOpen(true)}>
              Send Assessment
            </Button>

            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Unified Intelligence Metrics Strip */}
        <div className={styles.intelligenceBar}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>AI Fit Score</span>
            <span
              className={styles.metricValue}
              style={{
                color:
                  (candidate.ai_score ?? 0) >= 80
                    ? '#34d399'
                    : (candidate.ai_score ?? 0) >= 60
                    ? '#fbbf24'
                    : '#f87171',
              }}
            >
              {candidate.ai_score !== null && candidate.ai_score !== undefined
                ? `${candidate.ai_score} / 100`
                : 'Not Evaluated'}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>GitHub Score</span>
            <span
              className={styles.metricValue}
              style={{
                color:
                  (candidate.github_score ?? 0) >= 80
                    ? '#34d399'
                    : (candidate.github_score ?? 0) >= 60
                    ? '#fbbf24'
                    : '#f87171',
              }}
            >
              {candidate.github_score !== null && candidate.github_score !== undefined
                ? `${candidate.github_score} / 100`
                : 'Unanalyzed'}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Assessment Score</span>
            <span className={styles.metricValue}>
              {candidate.test_code !== null && candidate.test_code !== undefined
                ? `${candidate.test_code} / 100`
                : 'Pending'}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>CGPA / Academic</span>
            <span className={styles.metricValue}>
              {candidate.cgpa !== null && candidate.cgpa !== undefined
                ? `${candidate.cgpa} / 10`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Trigger Bar with Async Status Indicators */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderRadius: tokens.borderRadiusMedium,
            border: '1px solid rgba(148, 163, 184, 0.1)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              appearance="primary"
              icon={<SparkleRegular />}
              disabled={aiJobState === 'queued' || aiJobState === 'processing'}
              onClick={() => triggerAiEvaluation(true)}
            >
              {aiJobState === 'processing'
                ? 'Evaluating with AI...'
                : aiJobState === 'queued'
                ? 'Queued...'
                : 'Run AI Evaluation'}
            </Button>

            <Button
              appearance="secondary"
              icon={<DocumentTextRegular />}
              disabled={!candidate.resume_url || resumeJobState === 'queued' || resumeJobState === 'processing'}
              onClick={triggerResumeParse}
            >
              {resumeJobState === 'processing' ? 'Parsing Resume...' : 'Parse Resume'}
            </Button>

            <Button
              appearance="secondary"
              icon={<CodeRegular />}
              disabled={!candidate.github || githubJobState === 'queued' || githubJobState === 'processing'}
              onClick={() => triggerGithubAnalysis(true)}
            >
              {githubJobState === 'processing' ? 'Analyzing GitHub...' : 'Analyze GitHub'}
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {aiJobState === 'processing' && (
              <span className={styles.asyncStatusChip} style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                <Spinner size="extra-tiny" /> AI Processing
              </span>
            )}
            {resumeJobState === 'processing' && (
              <span className={styles.asyncStatusChip} style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <Spinner size="extra-tiny" /> Resume Processing
              </span>
            )}
            {githubJobState === 'processing' && (
              <span className={styles.asyncStatusChip} style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                <Spinner size="extra-tiny" /> GitHub Processing
              </span>
            )}
            {emailJobState === 'processing' && (
              <span className={styles.asyncStatusChip} style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                <Spinner size="extra-tiny" /> Sending Email
              </span>
            )}
          </div>
        </div>

        {/* 5-Tab Navigation Structure */}
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as typeof activeTab)}
        >
          <Tab value="overview" icon={<PersonRegular />}>
            Overview
          </Tab>
          <Tab value="intelligence" icon={<SparkleRegular />}>
            Intelligence
          </Tab>
          <Tab value="interviews" icon={<CalendarRegular />}>
            Interviews ({interviews.length})
          </Tab>
          <Tab value="communication" icon={<MailRegular />}>
            Communication ({emailLogs.length})
          </Tab>
          <Tab value="timeline" icon={<HistoryRegular />}>
            Activity Timeline ({timeline.length})
          </Tab>
        </TabList>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className={styles.panel}>
            <Title3>Candidate Overview & Profile</Title3>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Full Name</span>
                <span className={styles.infoValue}>{candidate.full_name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{candidate.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>College / Institution</span>
                <span className={styles.infoValue}>{candidate.college || 'Not specified'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Branch / Degree</span>
                <span className={styles.infoValue}>{candidate.branch || 'Not specified'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Academic CGPA</span>
                <span className={styles.infoValue}>{candidate.cgpa ?? 'Not recorded'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Learning Agility (Test LA)</span>
                <span className={styles.infoValue}>{candidate.test_la ?? 'Not recorded'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Coding Score (Test Code)</span>
                <span className={styles.infoValue}>{candidate.test_code ?? 'Not recorded'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Created In System</span>
                <span className={styles.infoValue}>
                  {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {candidate.best_ai_project && (
              <div className={styles.infoRow} style={{ marginTop: '12px' }}>
                <span className={styles.infoLabel}>Highlighted Project</span>
                <span className={styles.infoValue}>{candidate.best_ai_project}</span>
              </div>
            )}

            {candidate.research_work && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Research & Publications</span>
                <span className={styles.infoValue}>{candidate.research_work}</span>
              </div>
            )}

            {/* Intelligence Snapshots in Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: tokens.spacingHorizontalM, marginTop: '16px' }}>
              <div className={styles.subPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#818cf8' }}>Resume Snapshot</span>
                  <Badge appearance="tint" color={candidate.parsing_status === 'success' ? 'success' : 'informative'}>
                    {candidate.parsing_status || 'not parsed'}
                  </Badge>
                </div>
                <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
                  {candidate.resume_text
                    ? `${candidate.resume_text.slice(0, 160)}...`
                    : candidate.resume_url
                    ? 'Resume uploaded. Click Parse Resume to extract structured details.'
                    : 'No resume attached.'}
                </Body2>
                <Button appearance="subtle" size="small" onClick={() => { setActiveTab('intelligence'); setIntelligenceSubTab('resume'); }}>
                  View Resume Details &rarr;
                </Button>
              </div>

              <div className={styles.subPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#34d399' }}>GitHub Snapshot</span>
                  <Badge appearance="tint" color={ghAnalysis ? 'success' : 'informative'}>
                    {ghAnalysis ? `${ghAnalysis.score}/100` : 'Not analyzed'}
                  </Badge>
                </div>
                <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
                  {ghAnalysis?.portfolioVerdict || (candidate.github ? `GitHub: ${candidate.github}` : 'No GitHub handle')}
                </Body2>
                <Button appearance="subtle" size="small" onClick={() => { setActiveTab('intelligence'); setIntelligenceSubTab('github'); }}>
                  View GitHub Details &rarr;
                </Button>
              </div>

              <div className={styles.subPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#c084fc' }}>AI Fit Snapshot</span>
                  <Badge appearance="tint" color={aiEval ? 'success' : 'informative'}>
                    {aiEval ? `${aiEval.score}/100` : 'Not evaluated'}
                  </Badge>
                </div>
                <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
                  {aiEval?.recommendation || 'Run AI Evaluation to generate recommendation.'}
                </Body2>
                <Button appearance="subtle" size="small" onClick={() => { setActiveTab('intelligence'); setIntelligenceSubTab('ai'); }}>
                  View AI Evaluation &rarr;
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTELLIGENCE */}
        {activeTab === 'intelligence' && (
          <div className={styles.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <Title3>Candidate Intelligence</Title3>
              <TabList
                selectedValue={intelligenceSubTab}
                onTabSelect={(_, data) => setIntelligenceSubTab(data.value as typeof intelligenceSubTab)}
              >
                <Tab value="ai" icon={<SparkleRegular />}>AI Evaluation</Tab>
                <Tab value="github" icon={<CodeRegular />}>GitHub Insights</Tab>
                <Tab value="resume" icon={<DocumentTextRegular />}>Resume</Tab>
              </TabList>
            </div>

            {intelligenceSubTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {aiEval ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Overall Recommendation</span>
                      <span className={styles.infoValue} style={{ color: '#818cf8', fontWeight: 600 }}>
                        {aiEval.recommendation || 'Proceed to interview'}
                      </span>
                    </div>

                    {aiEval.summary && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Candidate Evaluation Summary</span>
                        <span className={styles.infoValue}>{aiEval.summary}</span>
                      </div>
                    )}

                    {Array.isArray(aiEval.strengths) && aiEval.strengths.length > 0 && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Key Strengths</span>
                        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {aiEval.strengths.map((s, idx) => (
                            <li key={idx} style={{ color: '#34d399', marginBottom: '4px' }}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(aiEval.weaknesses) && aiEval.weaknesses.length > 0 && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Potential Gaps / Areas to Probe</span>
                        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {aiEval.weaknesses.map((w, idx) => (
                            <li key={idx} style={{ color: '#fbbf24', marginBottom: '4px' }}>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(aiEval.interviewQuestions) && aiEval.interviewQuestions.length > 0 && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Suggested Technical Interview Questions</span>
                        <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {aiEval.interviewQuestions.map((q, idx) => (
                            <li key={idx} style={{ color: '#93c5fd', marginBottom: '6px' }}>
                              {q}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    Candidate has not been evaluated with AI yet. Click &quot;Run AI Evaluation&quot; above.
                  </div>
                )}
              </div>
            )}

            {intelligenceSubTab === 'github' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div className={styles.infoGrid} style={{ flex: 1 }}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>GitHub Handle</span>
                      <span className={styles.infoValue}>{candidate.github || 'Not provided'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Last Analyzed</span>
                      <span className={styles.infoValue}>
                        {candidate.github_last_analyzed
                          ? new Date(candidate.github_last_analyzed).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                  {candidate.github && (
                    <a
                      href={`https://github.com/${candidate.github.replace(/^https?:\/\/github\.com\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button appearance="secondary" icon={<OpenRegular />}>
                        View GitHub Profile
                      </Button>
                    </a>
                  )}
                </div>

                {ghAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ghAnalysis.portfolioVerdict && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Engineering Portfolio Verdict</span>
                        <span className={styles.infoValue} style={{ color: '#818cf8', fontWeight: 600 }}>
                          {ghAnalysis.portfolioVerdict}
                        </span>
                      </div>
                    )}

                    {ghAnalysis.summary && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Technical Summary</span>
                        <span className={styles.infoValue}>{ghAnalysis.summary}</span>
                      </div>
                    )}

                    {Array.isArray(ghAnalysis.languages) && ghAnalysis.languages.length > 0 && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Top Languages</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {ghAnalysis.languages.map((lang: string) => (
                            <Badge key={lang} appearance="filled" color="informative">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(ghAnalysis.highlights) && ghAnalysis.highlights.length > 0 && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Repository & Commit Highlights</span>
                        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {ghAnalysis.highlights.map((h, idx) => (
                            <li key={idx} style={{ color: '#34d399', marginBottom: '4px' }}>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ghAnalysis.strongestRepo && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Strongest Repository</span>
                        <span className={styles.infoValue}>{ghAnalysis.strongestRepo}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No GitHub analysis recorded. Click &quot;Analyze GitHub&quot; to fetch repository analysis.
                  </div>
                )}
              </div>
            )}

            {intelligenceSubTab === 'resume' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div className={styles.infoGrid} style={{ flex: 1 }}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Parsing Status</span>
                      <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                        {candidate.parsing_status || 'Not Applicable'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Parsed At</span>
                      <span className={styles.infoValue}>
                        {candidate.parsed_at ? new Date(candidate.parsed_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {candidate.resume_url && (
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Button appearance="secondary" icon={<OpenRegular />}>
                        Open Source Resume
                      </Button>
                    </a>
                  )}
                </div>

                {candidate.resume_text ? (
                  <div style={{ marginTop: '16px' }}>
                    <span className={styles.infoLabel}>Extracted Resume Content</span>
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '16px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: '8px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: '#e2e8f0',
                      }}
                    >
                      {candidate.resume_text}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No parsed text available. Click &quot;Parse Resume&quot; above to extract text.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTERVIEWS */}
        {activeTab === 'interviews' && (
          <div className={styles.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <Title3>Candidate Interviews</Title3>
              <Button appearance="primary" icon={<CalendarRegular />} onClick={() => setScheduleModalOpen(true)}>
                Schedule New Interview
              </Button>
            </div>

            {interviews.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                No interviews scheduled for this candidate yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {interviews.map((interview) => (
                  <div key={interview.id} className={styles.interviewCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, fontSize: '15px' }}>
                          Interviewer: {interview.interviewer_name}
                        </span>
                        <Badge
                          appearance="tint"
                          color={
                            interview.status === 'completed'
                              ? 'success'
                              : interview.status === 'cancelled'
                              ? 'danger'
                              : 'informative'
                          }
                        >
                          {interview.status}
                        </Badge>
                      </div>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {new Date(interview.scheduled_date).toLocaleString()} &bull; {interview.duration_minutes} minutes
                      </Caption1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {interview.meet_link && (
                        <a href={interview.meet_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Button appearance="secondary" size="small" icon={<VideoRegular />}>
                            Join Meet
                          </Button>
                        </a>
                      )}
                      {interview.status === 'scheduled' && (
                        <>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<CheckmarkRegular />}
                            onClick={() => handleUpdateInterviewStatus(interview.id, 'completed')}
                          >
                            Mark Completed
                          </Button>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<DismissRegular />}
                            onClick={() => handleUpdateInterviewStatus(interview.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMUNICATION */}
        {activeTab === 'communication' && (
          <div className={styles.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <Title3>Communication & Email Dispatch</Title3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button appearance="primary" icon={<MailRegular />} onClick={() => setAssessmentModalOpen(true)}>
                  Send Assessment Email
                </Button>
                <Button appearance="secondary" icon={<SendRegular />} onClick={() => setOfferModalOpen(true)}>
                  Extend Offer Email
                </Button>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <span className={styles.infoLabel}>Sent Email Logs ({emailLogs.length})</span>
              {emailLogs.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  No emails logged for this candidate yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {emailLogs.map((log) => (
                    <div key={log.id} className={styles.emailRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MailRegular style={{ fontSize: '20px', color: '#818cf8' }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, textTransform: 'capitalize' }}>
                              {log.email_type} Email
                            </span>
                            <Badge
                              appearance="tint"
                              color={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'danger' : 'informative'}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                            Recipient: {log.recipient} &bull; {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                          </Caption1>
                          {log.error_message && (
                            <Caption1 style={{ color: '#f87171', display: 'block' }}>Error: {log.error_message}</Caption1>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className={styles.panel}>
            <Title3>Candidate Activity Timeline ({timeline.length})</Title3>
            {timeline.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                No timeline events recorded yet.
              </div>
            ) : (
              <div>
                {timeline.map((event) => (
                  <div key={event.id} className={styles.timelineItem}>
                    <ClockRegular className={styles.timelineIcon} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                          {event.event_type}
                        </span>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          {event.created_at ? new Date(event.created_at).toLocaleString() : ''}
                        </Caption1>
                      </div>
                      {event.details && (
                        <Body2 style={{ color: tokens.colorNeutralForeground2 }}>{event.details}</Body2>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Interview Modal / Drawer */}
        <OverlayDrawer
          open={scheduleModalOpen}
          onOpenChange={(_, state) => !state.open && setScheduleModalOpen(false)}
          position="end"
        >
          <DrawerHeader>
            <DrawerHeaderTitle>Schedule Interview with {candidate.full_name}</DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={styles.drawerBody}>
            <Field label="Interviewer Name" required>
              <Input
                value={scheduleInterviewer}
                onChange={(_, data) => setScheduleInterviewer(data.value)}
                placeholder="e.g. Lead Engineer"
              />
            </Field>

            <Field label="Interview Date" required>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(_, data) => setScheduleDate(data.value)}
              />
            </Field>

            <Field label="Interview Time" required>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(_, data) => setScheduleTime(data.value)}
              />
            </Field>

            <Field label="Duration">
              <Dropdown
                value={`${scheduleDuration} minutes`}
                onOptionSelect={(_, data) => data.optionValue && setScheduleDuration(Number(data.optionValue))}
              >
                <Option value="30">30 minutes</Option>
                <Option value="45">45 minutes</Option>
                <Option value="60">60 minutes</Option>
                <Option value="90">90 minutes</Option>
              </Dropdown>
            </Field>

            <Button
              appearance="primary"
              disabled={savingInterview}
              onClick={handleCreateInterview}
            >
              {savingInterview ? 'Scheduling...' : 'Confirm & Schedule'}
            </Button>
          </DrawerBody>
        </OverlayDrawer>

        {/* Send Assessment Email Drawer */}
        <OverlayDrawer
          open={assessmentModalOpen}
          onOpenChange={(_, state) => !state.open && setAssessmentModalOpen(false)}
          position="end"
        >
          <DrawerHeader>
            <DrawerHeaderTitle>Send Assessment Email to {candidate.full_name}</DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={styles.drawerBody}>
            <Field label="Assessment Title" required>
              <Input
                value={assessmentTitle}
                onChange={(_, data) => setAssessmentTitle(data.value)}
                placeholder="e.g. Full-Stack Coding Assessment"
              />
            </Field>

            <Field label="Assessment URL" required>
              <Input
                value={assessmentUrl}
                onChange={(_, data) => setAssessmentUrl(data.value)}
              />
            </Field>

            <Field label="Deadline" required>
              <Input
                value={assessmentDeadline}
                onChange={(_, data) => setAssessmentDeadline(data.value)}
                placeholder="e.g. 7 days from receipt"
              />
            </Field>

            <Field label="Recruiter / Team Name" required>
              <Input
                value={recruiterName}
                onChange={(_, data) => setRecruiterName(data.value)}
              />
            </Field>

            <Button
              appearance="primary"
              disabled={sendingEmail}
              onClick={handleSendAssessmentEmail}
            >
              {sendingEmail ? 'Dispatching...' : 'Send Assessment Email'}
            </Button>
          </DrawerBody>
        </OverlayDrawer>

        {/* Send Offer Email Confirmation Drawer */}
        <OverlayDrawer
          open={offerModalOpen}
          onOpenChange={(_, state) => !state.open && setOfferModalOpen(false)}
          position="end"
        >
          <DrawerHeader>
            <DrawerHeaderTitle>Extend Offer to {candidate.full_name}</DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={styles.drawerBody}>
            <Body1>
              Are you sure you want to send an Employment Offer email to <strong>{candidate.email}</strong>?
            </Body1>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Sending this will automatically transition the candidate stage to &quot;Offer Extended&quot; and record a timeline event.
            </Caption1>

            <Field label="Recruiter / Team Signature">
              <Input
                value={recruiterName}
                onChange={(_, data) => setRecruiterName(data.value)}
              />
            </Field>

            <Button
              appearance="primary"
              disabled={sendingEmail}
              onClick={handleSendOfferEmail}
            >
              {sendingEmail ? 'Sending Offer...' : 'Confirm & Send Offer Email'}
            </Button>
          </DrawerBody>
        </OverlayDrawer>
      </div>
    </MainLayout>
  );
}

export default function CandidateDetailPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner label="Loading candidate detail..." />
          </div>
        </MainLayout>
      }
    >
      <CandidateDetailContent />
    </Suspense>
  );
}
