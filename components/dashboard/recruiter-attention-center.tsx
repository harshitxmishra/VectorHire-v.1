'use client';

import {
  Badge,
  Body2,
  Caption1,
  Button,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  AlertUrgentRegular,
  ClockRegular,
  CalendarRegular,
  MailRegular,
  ArrowRightRegular,
  CheckmarkCircleRegular,
  SparkleRegular,
  DocumentTextRegular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Candidate, Interview, JobDescription } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.3)'),
    },
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  cardLabel: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  cardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.4',
  },
  cardCount: {
    fontSize: '24px',
    fontWeight: 700,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'dashed', 'rgba(148, 163, 184, 0.15)'),
  },
});

interface RecruiterAttentionCenterProps {
  candidates: Candidate[];
  interviews: Interview[];
  jobs: JobDescription[];
  isLoading?: boolean;
}

export function RecruiterAttentionCenter({
  candidates,
  interviews,
  jobs,
  isLoading,
}: RecruiterAttentionCenterProps) {
  const styles = useStyles();

  // 1. Candidates Pending Review
  const pendingReview = candidates.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'applied' || s === 'pending' || s === 'reviewing';
  });

  // 2. Interviews Scheduled Today
  const todayStr = new Date().toDateString();
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled');
  const interviewsToday = scheduledInterviews.filter(
    (i) => new Date(i.scheduled_date).toDateString() === todayStr
  );

  // 3. Candidates Eligible for Interview (Ready to Schedule)
  const eligibleForInterview = candidates.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'interview eligible' || s === 'shortlisted';
  });

  // 4. Assessments Pending Candidate Completion
  const assessmentsPending = candidates.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'assessment sent';
  });

  // 5. Unevaluated AI Candidates
  const unevaluatedCandidates = candidates.filter(
    (c) => c.ai_score === null || c.ai_score === undefined
  );

  const totalAttentionItems =
    pendingReview.length +
    interviewsToday.length +
    assessmentsPending.length +
    eligibleForInterview.length;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.titleGroup}>
          <ClockRegular style={{ color: '#818cf8', fontSize: '20px' }} />
          <span className={styles.sectionTitle}>Recruiter Action Center</span>
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Analyzing talent pipeline for pending actions...
        </Caption1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <AlertUrgentRegular style={{ color: '#f59e0b', fontSize: '22px' }} />
          <span className={styles.sectionTitle}>Recruiter Action Center</span>
          <Badge
            appearance="filled"
            color={totalAttentionItems > 0 ? 'important' : 'informative'}
          >
            {totalAttentionItems} Actionable
          </Badge>
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Workflow items requiring recruiter review, scheduling, or communication
        </Caption1>
      </div>

      {totalAttentionItems === 0 && unevaluatedCandidates.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckmarkCircleRegular style={{ color: '#34d399', fontSize: '28px' }} />
          <div>
            <Body2 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
              All pipeline workflows are up to date!
            </Body2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              No candidates awaiting review, interviews pending today, or dispatched assessments.
            </Caption1>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {/* Candidates Pending Initial Review */}
          {pendingReview.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Pending Review</div>
                  <div className={styles.cardDescription}>
                    Candidates awaiting initial qualification review
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: '#fbbf24' }}>
                  {pendingReview.length}
                </span>
              </div>
              <Link href="/candidates?status=applied" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" size="small" icon={<ArrowRightRegular />}>
                  Review Candidates
                </Button>
              </Link>
            </div>
          )}

          {/* Interviews Scheduled Today */}
          {interviewsToday.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Interviews Today</div>
                  <div className={styles.cardDescription}>
                    Scheduled sessions taking place today
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: '#60a5fa' }}>
                  {interviewsToday.length}
                </span>
              </div>
              <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" size="small" icon={<CalendarRegular />}>
                  View Schedule
                </Button>
              </Link>
            </div>
          )}

          {/* Eligible for Interview */}
          {eligibleForInterview.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Awaiting Interview Scheduling</div>
                  <div className={styles.cardDescription}>
                    Qualified candidates ready for recruiter interview
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: '#818cf8' }}>
                  {eligibleForInterview.length}
                </span>
              </div>
              <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" size="small" icon={<CalendarRegular />}>
                  Schedule Interviews
                </Button>
              </Link>
            </div>
          )}

          {/* Assessments Pending Completion */}
          {assessmentsPending.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Assessments Dispatched</div>
                  <div className={styles.cardDescription}>
                    Assessment invitations sent, awaiting candidate submission
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: '#a78bfa' }}>
                  {assessmentsPending.length}
                </span>
              </div>
              <Link href="/candidates?status=assessment%20sent" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" size="small" icon={<MailRegular />}>
                  Track Assessments
                </Button>
              </Link>
            </div>
          )}

          {/* Unevaluated AI Candidates */}
          {unevaluatedCandidates.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Unevaluated Candidates</div>
                  <div className={styles.cardDescription}>
                    Profiles lacking automated AI evaluation score
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: '#94a3b8' }}>
                  {unevaluatedCandidates.length}
                </span>
              </div>
              <Link href="/ai-evaluation" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" size="small" icon={<SparkleRegular />}>
                  Run Evaluations
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
