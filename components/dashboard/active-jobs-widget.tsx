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
  DocumentText20Regular,
  Sparkle16Regular,
  ArrowRight16Regular,
  Add16Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { JobDescription } from '@/lib/types';

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
  jobCard: {
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
  jobInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '70%',
  },
  jobTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
    },
  },
  requirementsSnippet: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '400px',
  },
  dateMeta: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground4,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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

interface ActiveJobsWidgetProps {
  jobs: JobDescription[];
  isLoading?: boolean;
}

export function ActiveJobsWidget({ jobs, isLoading }: ActiveJobsWidgetProps) {
  const styles = useStyles();

  const activeJobs = [...jobs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <DocumentText20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.title}>Active Job Positions</span>
          <Badge appearance="tint" color="informative" size="small">
            {jobs.length} Active
          </Badge>
        </div>
        <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<ArrowRight16Regular />} className={styles.actionButton}>
            All Positions
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spinner size="small" label="Loading positions..." />
        </div>
      ) : activeJobs.length === 0 ? (
        <div className={styles.emptyState}>
          <DocumentText20Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground4 }} />
          <div style={{ color: tokens.colorNeutralForeground2, fontWeight: 600, fontSize: '12px' }}>
            No active job positions found
          </div>
          <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
            Create a job description with requirements to enable automated candidate matching.
          </span>
          <div style={{ marginTop: '8px' }}>
            <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
              <Button appearance="primary" size="small" icon={<Add16Regular />} className={styles.actionButton}>
                Create First Position
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {activeJobs.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobInfo}>
                <Link href={`/job-descriptions/${job.id}`} className={styles.jobTitle}>
                  {job.title}
                </Link>
                <div className={styles.requirementsSnippet}>
                  {job.requirements || 'No requirements specified.'}
                </div>
                <span className={styles.dateMeta}>
                  Added {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className={styles.actions}>
                <Link href={`/job-descriptions/${job.id}`} style={{ textDecoration: 'none' }}>
                  <Button appearance="secondary" size="small" icon={<Sparkle16Regular />} className={styles.actionButton}>
                    Matched Talent
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
