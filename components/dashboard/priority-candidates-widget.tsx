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
  People20Regular,
  Open16Regular,
  ArrowRight16Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { Candidate } from '@/lib/types';

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
    padding: '8px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tr: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: `background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  td: {
    padding: '10px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    verticalAlign: 'middle',
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
  candidateSub: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
  scoreBadge: {
    fontWeight: 650,
    fontSize: '12px',
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

interface PriorityCandidatesWidgetProps {
  candidates: Candidate[];
  isLoading?: boolean;
}

export function PriorityCandidatesWidget({
  candidates,
  isLoading,
}: PriorityCandidatesWidgetProps) {
  const styles = useStyles();

  const topCandidates = [...candidates]
    .sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0))
    .slice(0, 6);

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return tokens.colorNeutralForeground4;
    if (score >= 80) return tokens.colorStatusSuccessForeground1;
    if (score >= 60) return tokens.colorStatusWarningForeground1;
    return tokens.colorStatusDangerForeground1;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <People20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.title}>Priority Talent Snapshot</span>
          <Badge appearance="tint" color="informative" size="small">
            Top {topCandidates.length}
          </Badge>
        </div>
        <Link href="/candidates" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" size="small" icon={<ArrowRight16Regular />} className={styles.actionButton}>
            Directory
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spinner size="small" label="Loading talent snapshot..." />
        </div>
      ) : topCandidates.length === 0 ? (
        <div className={styles.emptyState}>
          <People20Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground4 }} />
          <div style={{ color: tokens.colorNeutralForeground2, fontWeight: 600, fontSize: '12px' }}>
            No candidates in talent pool
          </div>
          <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
            Upload candidates from the Candidate Directory to populate the workspace.
          </span>
          <div style={{ marginTop: '8px' }}>
            <Link href="/candidates" style={{ textDecoration: 'none' }}>
              <Button appearance="primary" size="small" className={styles.actionButton}>
                Go to Candidates
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Candidate</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>AI Match</th>
                <th className={styles.th}>GitHub</th>
                <th className={styles.th}>CGPA</th>
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
                      <span className={styles.candidateSub}>
                        {c.college || 'College Unspecified'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Badge appearance="tint" color="informative" size="small">
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
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <Link href={`/candidates/${c.id}`} style={{ textDecoration: 'none' }}>
                      <Button appearance="subtle" size="small" icon={<Open16Regular />} className={styles.actionButton}>
                        Profile
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
