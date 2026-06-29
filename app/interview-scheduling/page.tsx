'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';
import { BadgeStatus } from '@/components/ui/badge-status';
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
  interviewItem: {
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
  interviewContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

export default function InterviewSchedulingPage() {
  const styles = useStyles();
  const { candidates, loading, error } = useAppData();
  const readyForInterview = candidates
    .filter((c) => c.status?.toLowerCase() === 'shortlisted')
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 8);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Interview Scheduling</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer
          title="Interview Readiness Queue"
          subtitle="Shortlisted candidates ranked by AI score — no interview schedule data is tracked yet"
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading candidates...</p>
            ) : readyForInterview.length === 0 ? (
              <p>No shortlisted candidates yet.</p>
            ) : (
              readyForInterview.map((candidate) => (
                <div key={candidate.id} className={styles.interviewItem}>
                  <div className={styles.interviewContent}>
                    <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                      {candidate.full_name}
                    </div>
                    <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                      {candidate.college} • AI score {candidate.ai_score}
                    </div>
                  </div>
                  <BadgeStatus status={candidate.status} />
                </div>
              ))
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
