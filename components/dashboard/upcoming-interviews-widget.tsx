'use client';

import {
  Badge,
  Button,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Calendar16Regular,
  Video16Regular,
  Open16Regular,
  CalendarAgenda20Regular,
  Clock16Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Interview } from '@/lib/types';

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
  header: {
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
  title: {
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  interviewItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: `border-color ${tokens.durationFast}, background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  candidateInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  candidateName: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
    },
  },
  meta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actionButton: {
    fontSize: '11px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '24px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
  },
});

interface UpcomingInterviewsWidgetProps {
  interviews: Interview[];
  isLoading?: boolean;
}

export function UpcomingInterviewsWidget({
  interviews,
  isLoading,
}: UpcomingInterviewsWidgetProps) {
  const styles = useStyles();

  const now = Date.now();
  const scheduledUpcoming = interviews
    .filter((i) => i.status === 'scheduled' && new Date(i.scheduled_date).getTime() >= now - 60 * 60 * 1000)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <CalendarAgenda20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.title}>Upcoming Interviews</span>
          <Badge appearance="tint" color="informative" size="small">
            {scheduledUpcoming.length} Scheduled
          </Badge>
        </div>
        <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<Calendar16Regular />} className={styles.actionButton}>
            Calendar
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spinner size="small" label="Loading interview schedule..." />
        </div>
      ) : scheduledUpcoming.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar16Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground4 }} />
          <div style={{ color: tokens.colorNeutralForeground2, fontWeight: 600, fontSize: '12px' }}>
            No upcoming interviews scheduled
          </div>
          <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
            Candidates moved to &ldquo;Interview Eligible&rdquo; can be scheduled via candidate workspace.
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {scheduledUpcoming.map((item) => {
            const candidateName = item.candidates?.full_name || `Candidate #${item.candidate_id}`;
            const dateFormatted = new Date(item.scheduled_date).toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id} className={styles.interviewItem}>
                <div className={styles.candidateInfo}>
                  <Link href={`/candidates/${item.candidate_id}`} className={styles.candidateName}>
                    {candidateName}
                  </Link>
                  <div className={styles.meta}>
                    <Clock16Regular style={{ fontSize: '12px' }} />
                    <span>{dateFormatted}</span>
                    <span>&bull;</span>
                    <span>{item.duration_minutes} min</span>
                    <span>&bull;</span>
                    <span>{item.interviewer_name}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  {item.meet_link && (
                    <Button
                      appearance="primary"
                      size="small"
                      icon={<Video16Regular />}
                      className={styles.actionButton}
                      onClick={() => window.open(item.meet_link!, '_blank')}
                    >
                      Join
                    </Button>
                  )}
                  <Link href={`/candidates/${item.candidate_id}`} style={{ textDecoration: 'none' }}>
                    <Button appearance="subtle" size="small" icon={<Open16Regular />} className={styles.actionButton}>
                      Profile
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
