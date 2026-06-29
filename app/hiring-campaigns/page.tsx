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
  campaignItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  campaignContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  campaignTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  campaignDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  campaignScore: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 700,
    color: tokens.colorBrandBackground,
  },
});

export default function HiringCampaignsPage() {
  const styles = useStyles();
  const { collegeGroups, loading, error } = useAppData();

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Hiring Campaigns</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer title="Candidate Pools by College" subtitle="Grouped from the candidates table — no separate campaign data is tracked yet">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading candidate pools...</p>
            ) : collegeGroups.length === 0 ? (
              <p>No candidates yet.</p>
            ) : (
              collegeGroups.map((group) => (
                <div key={group.college} className={styles.campaignItem}>
                  <div className={styles.campaignContent}>
                    <div className={styles.campaignTitle}>{group.college}</div>
                    <div className={styles.campaignDesc}>
                      {group.shortlistedCount} shortlisted • {group.totalCandidates} total candidates
                    </div>
                  </div>
                  <div className={styles.campaignScore}>avg {group.averageAIScore}</div>
                </div>
              ))
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
