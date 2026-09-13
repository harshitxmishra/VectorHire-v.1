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
  DocumentText24Regular,
  SparkleRegular,
  ArrowRightRegular,
  AddRegular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { JobDescription } from '@/lib/types';

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
  jobCard: {
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
  jobInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '70%',
  },
  jobTitle: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: '#818cf8',
      textDecoration: 'underline',
    },
  },
  requirementsSnippet: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '420px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
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
          <DocumentText24Regular style={{ color: '#818cf8' }} />
          <span className={styles.title}>Active Job Positions</span>
          <Badge appearance="tint" color="informative">
            {jobs.length} Active
          </Badge>
        </div>
        <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<ArrowRightRegular />}>
            All Positions
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size="small" label="Loading job descriptions..." />
        </div>
      ) : activeJobs.length === 0 ? (
        <div className={styles.emptyState}>
          <DocumentText24Regular style={{ fontSize: '32px', color: '#94a3b8' }} />
          <Body2 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>
            No active job positions found
          </Body2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Create a job description with requirements to enable automated candidate matching.
          </Caption1>
          <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
            <Button appearance="primary" size="small" icon={<AddRegular />}>
              Create First Position
            </Button>
          </Link>
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
                <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                  Added {new Date(job.created_at).toLocaleDateString()}
                </Caption1>
              </div>

              <div className={styles.actions}>
                <Link href={`/job-descriptions/${job.id}`} style={{ textDecoration: 'none' }}>
                  <Button appearance="secondary" size="small" icon={<SparkleRegular />}>
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
