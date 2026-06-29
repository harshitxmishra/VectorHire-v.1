'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { AnalyticsSection } from '@/components/dashboard/analytics-section';
import { makeStyles, tokens, Title2, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useAppData } from '@/lib/hooks/use-app-data';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
  },
});

export default function DashboardPage() {
  const styles = useStyles();
  const { candidates, collegeGroups, scoreBuckets, kpis, loading, error } = useAppData();

  return (
    <MainLayout>
      <div className={styles.section}>
        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <div>
          <Title2 className={styles.sectionTitle}>Dashboard</Title2>
          <KPICards data={kpis} isLoading={loading} />
        </div>

        <div>
          <Title2 className={styles.sectionTitle}>Analytics</Title2>
          {!loading && (
            <AnalyticsSection
              candidates={candidates}
              collegeGroups={collegeGroups}
              scoreBuckets={scoreBuckets}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
