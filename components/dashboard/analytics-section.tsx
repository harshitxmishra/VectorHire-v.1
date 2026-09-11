'use client';

import { makeStyles, tokens, shorthands, Caption1, Badge } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
import { BadgeStatus } from '@/components/ui/badge-status';
import { Candidate, CollegeGroup, ScoreBucket } from '@/lib/types';
import { HiringFunnelChart } from '@/components/analytics/HiringFunnelChart';
import { ScoreDistributionChart } from '@/components/analytics/ScoreDistributionChart';
import { CollegeYieldChart } from '@/components/analytics/CollegeYieldChart';

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
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(39, 54, 78, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.3)'),
    },
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemLabel: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  itemDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface AnalyticsSectionProps {
  candidates: Candidate[];
  collegeGroups: CollegeGroup[];
  scoreBuckets: ScoreBucket[];
}

export function AnalyticsSection({
  candidates,
  collegeGroups,
  scoreBuckets,
}: AnalyticsSectionProps) {
  const styles = useStyles();

  const hiringFunnel = [
    { stage: '1. Sourced & Applied', count: candidates.length },
    {
      stage: '2. AI Screened (>70%)',
      count: candidates.filter((c) => (c.ai_score || 0) >= 70).length,
    },
    {
      stage: '3. Shortlisted',
      count: candidates.filter((c) => c.status?.toLowerCase() === 'shortlisted').length,
    },
    {
      stage: '4. Hired',
      count: candidates.filter((c) => c.status?.toLowerCase() === 'hired').length,
    },
  ];

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className={styles.grid}>
      {/* Hiring Funnel */}
      <ChartContainer title="Recruitment Funnel" subtitle="Pipeline velocity by stage">
        <HiringFunnelChart stages={hiringFunnel} />
      </ChartContainer>

      {/* AI Score Distribution */}
      <ChartContainer
        title="AI Score Distribution"
        subtitle="Candidates grouped by match score range"
      >
        <ScoreDistributionChart scoreBuckets={scoreBuckets} />
      </ChartContainer>

      {/* Top Colleges */}
      <ChartContainer title="Top College Yield" subtitle="Conversion rate by academic pool">
        <CollegeYieldChart collegeGroups={collegeGroups} />
      </ChartContainer>

      {/* Recently Added Candidates */}
      <ChartContainer title="Recently Processed" subtitle="Latest candidates evaluated in workspace">
        <div className={styles.list}>
          {recentCandidates.length === 0 ? (
            <div className={styles.itemDescription}>No candidates yet.</div>
          ) : (
            recentCandidates.map((candidate) => (
              <div key={candidate.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemLabel}>{candidate.full_name}</div>
                  <div className={styles.itemDescription}>
                    {candidate.college} • AI score {candidate.ai_score}%
                  </div>
                </div>
                <Badge
                  appearance="tint"
                  color={
                    candidate.status?.toLowerCase() === 'hired'
                      ? 'success'
                      : candidate.status?.toLowerCase() === 'shortlisted'
                      ? 'informative'
                      : 'subtle'
                  }
                >
                  {candidate.status || 'Applied'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </ChartContainer>
    </div>
  );
}
