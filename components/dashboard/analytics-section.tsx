'use client';

import { makeStyles, tokens, shorthands, Badge } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
import { Candidate, CollegeGroup, ScoreBucket } from '@/lib/types';
import { HiringFunnelChart } from '@/components/analytics/HiringFunnelChart';
import { ScoreDistributionChart } from '@/components/analytics/ScoreDistributionChart';
import { CollegeYieldChart } from '@/components/analytics/CollegeYieldChart';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemLabel: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  itemDescription: {
    fontSize: '11px',
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
        title="AI Match Distribution"
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
                  size="small"
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
