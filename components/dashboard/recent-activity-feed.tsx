'use client';

import {
  Badge,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  History20Regular,
  Sparkle16Regular,
  Calendar16Regular,
  Mail16Regular,
  DocumentText16Regular,
  Code16Regular,
  CheckmarkCircle16Regular,
  Tag16Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { TimelineEvent } from '@/lib/types';

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
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '380px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'flex-start',
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
  eventIconWrapper: {
    marginTop: '2px',
    width: '24px',
    height: '24px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eventContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '6px',
  },
  candidateLink: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
    },
  },
  detailsText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '15px',
  },
  timestamp: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground4,
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

interface RecentActivityFeedProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export function RecentActivityFeed({ events, isLoading }: RecentActivityFeedProps) {
  const styles = useStyles();

  const getEventIcon = (eventType: string) => {
    const et = eventType.toLowerCase();
    if (et.includes('ai') || et.includes('evaluat')) {
      return <Sparkle16Regular style={{ color: tokens.colorBrandForeground1 }} />;
    }
    if (et.includes('interview')) {
      return <Calendar16Regular style={{ color: tokens.colorBrandForeground2 }} />;
    }
    if (et.includes('email') || et.includes('assessment') || et.includes('offer')) {
      return <Mail16Regular style={{ color: tokens.colorStatusWarningForeground1 }} />;
    }
    if (et.includes('resume')) {
      return <DocumentText16Regular style={{ color: tokens.colorStatusSuccessForeground1 }} />;
    }
    if (et.includes('github')) {
      return <Code16Regular style={{ color: tokens.colorBrandForeground1 }} />;
    }
    if (et.includes('status')) {
      return <Tag16Regular style={{ color: tokens.colorNeutralForeground2 }} />;
    }
    return <CheckmarkCircle16Regular style={{ color: tokens.colorNeutralForeground4 }} />;
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
          <History20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.title}>Recent Pipeline Activity</span>
          <Badge appearance="tint" color="informative" size="small">
            {events.length} Events
          </Badge>
        </div>
        <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground4 }}>
          Live timeline stream
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spinner size="small" label="Loading timeline activity..." />
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <History20Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground4 }} />
          <div style={{ color: tokens.colorNeutralForeground2, fontWeight: 600, fontSize: '12px' }}>
            No recent timeline activity
          </div>
          <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
            Recruiter actions, status changes, and AI evaluations will appear here in chronological order.
          </span>
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
