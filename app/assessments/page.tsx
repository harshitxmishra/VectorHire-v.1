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
  assessmentItem: {
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
  assessmentContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

function daysAgo(dateString: string) {
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function AssessmentsPage() {
  const styles = useStyles();
  const { candidates, loading, error } = useAppData();
  const pendingReview = candidates
    .filter((c) => c.status?.toLowerCase() === 'pending')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 8);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Assessments</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer title="Pending Review" subtitle="Candidates awaiting evaluation, oldest first">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading candidates...</p>
            ) : pendingReview.length === 0 ? (
              <p>No candidates awaiting review.</p>
            ) : (
              pendingReview.map((candidate) => (
                <div key={candidate.id} className={styles.assessmentItem}>
                  <div className={styles.assessmentContent}>
                    <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                      {candidate.full_name}
                    </div>
                    <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                      {candidate.college} • AI score {candidate.ai_score} • Applied{' '}
                      {daysAgo(candidate.created_at)}
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
