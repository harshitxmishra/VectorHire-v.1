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
  People24Regular,
  OpenRegular,
  ArrowRightRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Candidate } from '@/lib/types';

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
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '10px 12px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  },
  tr: {
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
  },
  td: {
    padding: '12px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    verticalAlign: 'middle',
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
  scoreBadge: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase200,
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

interface PriorityCandidatesWidgetProps {
  candidates: Candidate[];
  isLoading?: boolean;
}

export function PriorityCandidatesWidget({
  candidates,
  isLoading,
}: PriorityCandidatesWidgetProps) {
  const styles = useStyles();

  // Sort by highest AI score (deterministic, transparent ordering)
  const topCandidates = [...candidates]
    .sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0))
    .slice(0, 6);

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return '#94a3b8';
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <People24Regular style={{ color: '#818cf8' }} />
          <span className={styles.title}>Priority Talent Snapshot</span>
          <Badge appearance="tint" color="informative">
            Top {topCandidates.length}
          </Badge>
        </div>
        <Link href="/candidates" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<ArrowRightRegular />}>
            Candidate Directory
          </Button>
        </Link>
      </div>

      <Caption1 style={{ color: tokens.colorNeutralForeground4, display: 'block' }}>
        * Multi-dimensional candidate signals are shown independently. No composite or weighted formula is applied.
      </Caption1>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size="small" label="Loading talent snapshot..." />
        </div>
      ) : topCandidates.length === 0 ? (
        <div className={styles.emptyState}>
          <People24Regular style={{ fontSize: '32px', color: '#94a3b8' }} />
          <Body2 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>
            No candidates in talent pool
          </Body2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Upload candidates from the Candidate Directory to populate the workspace.
          </Caption1>
          <Link href="/candidates" style={{ textDecoration: 'none' }}>
            <Button appearance="primary" size="small">
              Go to Candidates
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Candidate</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>AI Fit</th>
                <th className={styles.th}>GitHub</th>
                <th className={styles.th}>CGPA</th>
                <th className={styles.th}>Test Code</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {topCandidates.map((c) => (
                <tr key={c.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Link href={`/candidates/${c.id}`} className={styles.candidateName}>
                        {c.full_name}
                      </Link>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {c.college || 'College Unspecified'}
                      </Caption1>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Badge appearance="tint" color="informative">
                      {c.status || 'Applied'}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={styles.scoreBadge}
                      style={{ color: getScoreColor(c.ai_score) }}
                    >
                      {c.ai_score !== null && c.ai_score !== undefined
                        ? `${c.ai_score}%`
                        : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={styles.scoreBadge}
                      style={{ color: getScoreColor(c.github_score) }}
                    >
                      {c.github_score !== null && c.github_score !== undefined
                        ? `${c.github_score}%`
                        : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                      {c.cgpa !== null && c.cgpa !== undefined ? c.cgpa : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span style={{ color: tokens.colorNeutralForeground2 }}>
                      {c.test_code || '—'}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <Link href={`/candidates/${c.id}`} style={{ textDecoration: 'none' }}>
                      <Button appearance="subtle" size="small" icon={<OpenRegular />}>
                        Workspace
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
