'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
import { HiringFunnelChart } from '@/components/analytics/HiringFunnelChart';
import { ScoreDistributionChart } from '@/components/analytics/ScoreDistributionChart';
import { CollegeYieldChart } from '@/components/analytics/CollegeYieldChart';
import { useAppData } from '@/lib/hooks/use-app-data';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  kpiCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  kpiValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  kpiLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalXL,
    '@media (max-width: 1000px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export default function AnalyticsPage() {
  const styles = useStyles();
  const { candidates, collegeGroups, scoreBuckets, loading, error } = useAppData();

  const hiredCount = candidates.filter((c) => c.status?.toLowerCase() === 'hired').length;
  const shortlistedCount = candidates.filter((c) => c.status?.toLowerCase() === 'shortlisted').length;
  const interviewCount = candidates.filter(
    (c) => c.status?.toLowerCase() === 'interview scheduled' || c.status?.toLowerCase() === 'interview eligible'
  ).length;

  const conversionRate = candidates.length
    ? ((hiredCount / candidates.length) * 100).toFixed(1)
    : '0';
  const averageCGPA = candidates.length
    ? (candidates.reduce((sum, c) => sum + (c.cgpa ?? 0), 0) / candidates.length).toFixed(2)
    : '0';
  const averageAIScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + (c.ai_score ?? 0), 0) / candidates.length)
    : 0;

  const funnelStages = [
    { stage: '1. Sourced & Applied', count: candidates.length },
    { stage: '2. AI Screened (>70%)', count: candidates.filter((c) => (c.ai_score || 0) >= 70).length },
    { stage: '3. Shortlisted', count: shortlistedCount },
    { stage: '4. Interview Round', count: interviewCount },
    { stage: '5. Final Hired', count: hiredCount },
  ];

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Recruitment Intelligence & Analytics</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        {/* Top KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Candidate Pipeline</span>
            <span className={styles.kpiValue}>{candidates.length}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Average AI Match</span>
            <span className={styles.kpiValue} style={{ color: '#818cf8' }}>
              {averageAIScore}%
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Average CGPA</span>
            <span className={styles.kpiValue} style={{ color: '#38bdf8' }}>
              {averageCGPA}
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Hire Conversion Yield</span>
            <span className={styles.kpiValue} style={{ color: '#4ade80' }}>
              {conversionRate}%
            </span>
          </div>
        </div>

        {loading ? (
          <p>Loading analytics graphs...</p>
        ) : (
          <div className={styles.chartsGrid}>
            <ChartContainer
              title="Recruitment Funnel Velocity"
              subtitle="Step-by-step conversion from application to final hire"
            >
              <HiringFunnelChart stages={funnelStages} />
            </ChartContainer>

            <ChartContainer
              title="AI Score Distribution"
              subtitle="Breakdown of candidates by AI match rating tier"
            >
              <ScoreDistributionChart scoreBuckets={scoreBuckets} />
            </ChartContainer>

            <div style={{ gridColumn: '1 / -1' }}>
              <ChartContainer
                title="Campus & Sourcing Pool Yield"
                subtitle="Conversion rate and shortlist efficiency across target academic institutions"
              >
                <CollegeYieldChart collegeGroups={collegeGroups} />
              </ChartContainer>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
