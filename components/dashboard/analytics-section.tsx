'use client';

import { makeStyles, tokens } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
import { BadgeStatus } from '@/components/ui/badge-status';
import { Candidate, CollegeGroup, ScoreBucket } from '@/lib/types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: tokens.spacingVerticalXL,
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr',
    },
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    transition: `background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  itemLabel: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  itemDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  funnelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  funnelStage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  funnelBar: {
    flex: 1,
    height: '24px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground,
    opacity: 1,
    transition: `all ${tokens.durationFast}`,
  },
  funnelLabel: {
    minWidth: '120px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: 600,
  },
});

interface AnalyticsSectionProps {
  candidates: Candidate[];
  collegeGroups: CollegeGroup[];
  scoreBuckets: ScoreBucket[];
}

export function AnalyticsSection({ candidates, collegeGroups, scoreBuckets }: AnalyticsSectionProps) {
  const styles = useStyles();

  const hiringFunnel = [
    { stage: 'Applied', count: candidates.length },
    {
      stage: 'Pending',
      count: candidates.filter((c) => c.status?.toLowerCase() === 'pending').length,
    },
    {
      stage: 'Shortlisted',
      count: candidates.filter((c) => c.status?.toLowerCase() === 'shortlisted').length,
    },
    {
      stage: 'Hired',
      count: candidates.filter((c) => c.status?.toLowerCase() === 'hired').length,
    },
  ];

  const maxFunnelCount = Math.max(1, ...hiringFunnel.map((s) => s.count));
  const maxScoreCount = Math.max(1, ...scoreBuckets.map((b) => b.count));

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className={styles.grid}>
      {/* Hiring Funnel */}
      <ChartContainer title="Hiring Funnel" subtitle="Candidates by pipeline stage">
        <div className={styles.funnelContainer}>
          {hiringFunnel.map((stage, idx) => (
            <div key={stage.stage} className={styles.funnelStage}>
              <div
                className={styles.funnelBar}
                style={{
                  width: `${(stage.count / maxFunnelCount) * 100}%`,
                  opacity: 1 - idx * 0.15,
                }}
              />
              <span className={styles.funnelLabel}>{stage.stage}</span>
              <span style={{ fontWeight: 600 }}>{stage.count}</span>
            </div>
          ))}
        </div>
      </ChartContainer>

      {/* Recently Added Candidates */}
      <ChartContainer title="Recently Added" subtitle="Newest candidates in the database">
        <div className={styles.list}>
          {recentCandidates.length === 0 ? (
            <div className={styles.itemDescription}>No candidates yet.</div>
          ) : (
            recentCandidates.map((candidate) => (
              <div key={candidate.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemLabel}>{candidate.full_name}</div>
                  <div className={styles.itemDescription}>
                    {candidate.college} • AI score {candidate.ai_score}
                  </div>
                </div>
                <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  {new Date(candidate.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ChartContainer>

      {/* AI Score Distribution */}
      <ChartContainer title="AI Score Distribution" subtitle="Candidates grouped by AI score range">
        <div className={styles.funnelContainer}>
          {scoreBuckets.map((bucket, idx) => (
            <div key={bucket.label} className={styles.funnelStage}>
              <div
                className={styles.funnelBar}
                style={{
                  width: `${(bucket.count / maxScoreCount) * 100}%`,
                  opacity: 1 - idx * 0.15,
                }}
              />
              <span className={styles.funnelLabel}>{bucket.label}</span>
              <span style={{ fontWeight: 600 }}>{bucket.count}</span>
            </div>
          ))}
        </div>
      </ChartContainer>

      {/* Top Colleges */}
      <ChartContainer title="Top Colleges" subtitle="Candidate pools by college">
        <div className={styles.list}>
          {collegeGroups.length === 0 ? (
            <div className={styles.itemDescription}>No candidates yet.</div>
          ) : (
            collegeGroups.slice(0, 5).map((group) => (
              <div key={group.college} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemLabel}>{group.college}</div>
                  <div className={styles.itemDescription}>
                    {group.shortlistedCount} shortlisted • {group.totalCandidates} total • avg score{' '}
                    {group.averageAIScore}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ChartContainer>

      {/* Candidate Pipeline */}
      <ChartContainer title="Candidate Status Distribution" subtitle="Breakdown of candidates by current status">
        <div className={styles.list}>
          {['new', 'pending', 'shortlisted', 'rejected', 'hired'].map((status) => {
            const statusCandidates = candidates.filter(
              (c) => c.status?.toLowerCase() === status
            ).length;
            const percentage = candidates.length
              ? ((statusCandidates / candidates.length) * 100).toFixed(0)
              : '0';

            return (
              <div key={status} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <BadgeStatus status={status} />
                </div>
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'center' }}>
                  <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 600 }}>
                    {statusCandidates}
                  </div>
                  <div style={{ minWidth: '40px', textAlign: 'right', color: tokens.colorNeutralForeground3 }}>
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>
    </div>
  );
}
