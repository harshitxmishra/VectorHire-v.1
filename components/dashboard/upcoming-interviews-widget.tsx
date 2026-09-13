'use client';

import {
  Badge,
  Body2,
  Caption1,
  Button,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  CalendarRegular,
  VideoRegular,
  OpenRegular,
  CalendarAgenda24Regular,
  ClockRegular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Interview } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
  },
  header: {
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
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  interviewItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.08)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.25)'),
    },
  },
  candidateInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  candidateName: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: '#818cf8',
      textDecoration: 'underline',
    },
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'dashed', 'rgba(148, 163, 184, 0.15)'),
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
          <CalendarAgenda24Regular style={{ color: '#818cf8' }} />
          <span className={styles.title}>Upcoming Interviews</span>
          <Badge appearance="tint" color="informative">
            {scheduledUpcoming.length} Scheduled
          </Badge>
        </div>
        <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<CalendarRegular />}>
            Full Calendar
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size="small" label="Loading interview schedule..." />
        </div>
      ) : scheduledUpcoming.length === 0 ? (
        <div className={styles.emptyState}>
          <CalendarRegular style={{ fontSize: '32px', color: '#94a3b8' }} />
          <Body2 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>
            No upcoming interviews scheduled
          </Body2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Candidates moved to &ldquo;Interview Eligible&rdquo; can be scheduled via candidate workspace or calendar.
          </Caption1>
          <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
            <Button appearance="secondary" size="small">
              Schedule New Interview
            </Button>
          </Link>
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
                    <ClockRegular style={{ fontSize: '14px' }} />
                    <span>{dateFormatted}</span>
                    <span>&bull;</span>
                    <span>{item.duration_minutes} min</span>
                    <span>&bull;</span>
                    <span>Interviewer: {item.interviewer_name}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  {item.meet_link && (
                    <Button
                      appearance="primary"
                      size="small"
                      icon={<VideoRegular />}
                      onClick={() => window.open(item.meet_link!, '_blank')}
                    >
                      Join Meet
                    </Button>
                  )}
                  <Link href={`/candidates/${item.candidate_id}`} style={{ textDecoration: 'none' }}>
                    <Button appearance="subtle" size="small" icon={<OpenRegular />}>
                      Workspace
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
