'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: tokens.spacingVerticalXL,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
});

export default function AnalyticsPage() {
  const styles = useStyles();
  const { candidates, collegeGroups, loading, error } = useAppData();

  const conversionRate = candidates.length
    ? (
        (candidates.filter((c) => c.status?.toLowerCase() === 'hired').length /
          candidates.length) *
        100
      ).toFixed(1)
    : '0';
  const averageCGPA = candidates.length
    ? (candidates.reduce((sum, c) => sum + (c.cgpa ?? 0), 0) / candidates.length).toFixed(2)
    : '0';
  const averageAIScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + (c.ai_score ?? 0), 0) / candidates.length)
    : 0;

  const stats = [
    { label: 'Conversion Rate', value: `${conversionRate}%` },
    { label: 'Total Candidates', value: `${candidates.length}` },
    { label: 'Average CGPA', value: averageCGPA },
    { label: 'Average AI Score', value: `${averageAIScore}%` },
  ];

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Analytics & Reporting</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
        <div className={styles.grid}>
          <ChartContainer title="Key Metrics" subtitle="Overall recruiting performance at a glance">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statRow}>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: tokens.fontSizeBase500, fontWeight: 700, color: tokens.colorBrandBackground }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>

          <ChartContainer title="College Performance" subtitle="Conversion rate by college">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {collegeGroups.length === 0 ? (
                <p>No candidates yet.</p>
              ) : (
                collegeGroups.slice(0, 4).map((group) => {
                  const groupConversionRate =
                    group.totalCandidates > 0
                      ? ((group.shortlistedCount / group.totalCandidates) * 100).toFixed(1)
                      : '0';
                  return (
                    <div key={group.college} className={styles.statRow}>
                      <div>
                        <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                          {group.college}
                        </div>
                        <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                          {group.totalCandidates} candidates
                        </div>
                      </div>
                      <div style={{ fontSize: tokens.fontSizeBase400, fontWeight: 700, color: tokens.colorBrandBackground }}>
                        {groupConversionRate}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ChartContainer>
        </div>
        )}
      </div>
    </MainLayout>
  );
}
