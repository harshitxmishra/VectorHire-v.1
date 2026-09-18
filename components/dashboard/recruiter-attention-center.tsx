'use client';

import {
  Badge,
  Button,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  AlertUrgent16Regular,
  Clock16Regular,
  Calendar16Regular,
  Mail16Regular,
  ArrowRight16Regular,
  CheckmarkCircle16Regular,
  Sparkle16Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Candidate, Interview, JobDescription } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: `border-color ${tokens.durationFast}, background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardLabel: {
    fontWeight: 600,
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
  },
  cardDescription: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '15px',
    marginTop: '2px',
  },
  cardCount: {
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: '22px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  actionLink: {
    fontSize: '11px',
    padding: '0',
    height: 'auto',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
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
          <Clock16Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.sectionTitle}>Recruiter Action Center</span>
        </div>
        <span className={styles.subtitle}>
          Analyzing talent pipeline for pending actions...
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <AlertUrgent16Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.sectionTitle}>Recruiter Action Center</span>
          <Badge
            appearance="filled"
            color={totalAttentionItems > 0 ? 'important' : 'informative'}
            size="small"
          >
            {totalAttentionItems} Actionable
          </Badge>
        </div>
        <span className={styles.subtitle}>
          Workflow items requiring recruiter review, scheduling, or communication
        </span>
      </div>

      {totalAttentionItems === 0 && unevaluatedCandidates.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckmarkCircle16Regular style={{ color: tokens.colorStatusSuccessForeground1, fontSize: '20px' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '12px', color: tokens.colorNeutralForeground1 }}>
              All pipeline workflows are up to date!
            </div>
            <span className={styles.subtitle}>
              No candidates awaiting review, interviews pending today, or dispatched assessments.
            </span>
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
                <span className={styles.cardCount} style={{ color: tokens.colorStatusWarningForeground1 }}>
                  {pendingReview.length}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <Link href="/candidates?status=applied" style={{ textDecoration: 'none' }}>
                  <Button appearance="subtle" size="small" icon={<ArrowRight16Regular />} className={styles.actionLink}>
                    Review Candidates
                  </Button>
                </Link>
              </div>
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
                <span className={styles.cardCount} style={{ color: tokens.colorBrandForeground1 }}>
                  {interviewsToday.length}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
                  <Button appearance="subtle" size="small" icon={<Calendar16Regular />} className={styles.actionLink}>
                    View Schedule
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Eligible for Interview */}
          {eligibleForInterview.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Awaiting Scheduling</div>
                  <div className={styles.cardDescription}>
                    Qualified candidates ready for recruiter interview
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: tokens.colorBrandForeground1 }}>
                  {eligibleForInterview.length}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
                  <Button appearance="subtle" size="small" icon={<Calendar16Regular />} className={styles.actionLink}>
                    Schedule Interviews
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Assessments Pending Completion */}
          {assessmentsPending.length > 0 && (
            <div className={styles.actionCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardLabel}>Assessments Dispatched</div>
                  <div className={styles.cardDescription}>
                    Invitations sent, awaiting candidate submission
                  </div>
                </div>
                <span className={styles.cardCount} style={{ color: tokens.colorNeutralForeground2 }}>
                  {assessmentsPending.length}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <Link href="/candidates?status=assessment%20sent" style={{ textDecoration: 'none' }}>
                  <Button appearance="subtle" size="small" icon={<Mail16Regular />} className={styles.actionLink}>
                    Track Assessments
                  </Button>
                </Link>
              </div>
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
                <span className={styles.cardCount} style={{ color: tokens.colorNeutralForeground4 }}>
                  {unevaluatedCandidates.length}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <Link href="/ai-evaluation" style={{ textDecoration: 'none' }}>
                  <Button appearance="subtle" size="small" icon={<Sparkle16Regular />} className={styles.actionLink}>
                    Run Evaluations
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
