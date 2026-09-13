'use client';

import {
  Badge,
  Body2,
  Caption1,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  History24Regular,
  SparkleRegular,
  CalendarRegular,
  MailRegular,
  DocumentTextRegular,
  CodeRegular,
  CheckmarkCircleRegular,
  TagRegular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { TimelineEvent } from '@/lib/types';

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
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: tokens.spacingHorizontalXS,
  },
  feedItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.08)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.25)'),
    },
  },
  eventIconWrapper: {
    marginTop: '2px',
    padding: '6px',
    borderRadius: '8px',
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  candidateLink: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: '#818cf8',
      textDecoration: 'underline',
    },
  },
  detailsText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.4',
  },
  timestamp: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
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

interface RecentActivityFeedProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export function RecentActivityFeed({ events, isLoading }: RecentActivityFeedProps) {
  const styles = useStyles();

  const getEventIcon = (eventType: string) => {
    const et = eventType.toLowerCase();
    if (et.includes('ai') || et.includes('evaluat')) {
      return <SparkleRegular style={{ color: '#818cf8', fontSize: '16px' }} />;
    }
    if (et.includes('interview')) {
      return <CalendarRegular style={{ color: '#60a5fa', fontSize: '16px' }} />;
    }
    if (et.includes('email') || et.includes('assessment') || et.includes('offer')) {
      return <MailRegular style={{ color: '#f59e0b', fontSize: '16px' }} />;
    }
    if (et.includes('resume')) {
      return <DocumentTextRegular style={{ color: '#34d399', fontSize: '16px' }} />;
    }
    if (et.includes('github')) {
      return <CodeRegular style={{ color: '#c084fc', fontSize: '16px' }} />;
    }
    if (et.includes('status')) {
      return <TagRegular style={{ color: '#38bdf8', fontSize: '16px' }} />;
    }
    return <CheckmarkCircleRegular style={{ color: '#94a3b8', fontSize: '16px' }} />;
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <History24Regular style={{ color: '#818cf8' }} />
          <span className={styles.title}>Recent Pipeline Activity</span>
          <Badge appearance="tint" color="informative">
            {events.length} Events
          </Badge>
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
          Live timeline stream
        </Caption1>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size="small" label="Loading timeline activity..." />
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <History24Regular style={{ fontSize: '32px', color: '#94a3b8' }} />
          <Body2 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>
            No recent timeline activity
          </Body2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Recruiter actions, status changes, and AI evaluations will appear here in chronological order.
          </Caption1>
        </div>
      ) : (
        <div className={styles.feedList}>
          {events.map((event) => {
            const candidateName = event.candidates?.full_name || `Candidate #${event.candidate_id}`;
            const timeAgo = new Date(event.created_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={event.id} className={styles.feedItem}>
                <div className={styles.eventIconWrapper}>
                  {getEventIcon(event.event_type)}
                </div>

                <div className={styles.eventContent}>
                  <div className={styles.eventHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link href={`/candidates/${event.candidate_id}`} className={styles.candidateLink}>
                        {candidateName}
                      </Link>
                      <Badge appearance="tint" size="small" color="subtle">
                        {formatEventType(event.event_type)}
                      </Badge>
                    </div>
                    <span className={styles.timestamp}>{timeAgo}</span>
                  </div>

                  {event.details && (
                    <div className={styles.detailsText}>{event.details}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
