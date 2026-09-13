'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { RecruiterAttentionCenter } from '@/components/dashboard/recruiter-attention-center';
import { UpcomingInterviewsWidget } from '@/components/dashboard/upcoming-interviews-widget';
import { ActiveJobsWidget } from '@/components/dashboard/active-jobs-widget';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { PriorityCandidatesWidget } from '@/components/dashboard/priority-candidates-widget';
import { AnalyticsSection } from '@/components/dashboard/analytics-section';
import {
  makeStyles,
  tokens,
  shorthands,
  Title2,
  Caption1,
  Button,
  MessageBar,
  MessageBarBody,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  PeopleRegular,
  DocumentTextRegular,
  CalendarRegular,
  WindowAd24Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { useAppData } from '@/lib/hooks/use-app-data';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useState } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  headerBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalXL,
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
    },
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
});

export default function DashboardPage() {
  const styles = useStyles();
  const notify = useAppToast();
  const {
    candidates,
    interviews,
    jobs,
    timelineEvents,
    collegeGroups,
    scoreBuckets,
    kpis,
    loading,
    error,
    reload,
  } = useAppData();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
    notify('Dashboard pipeline data refreshed.', 'success');
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Error Banner */}
        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        {/* Recruiter Command Center Header */}
        <div className={styles.headerBanner}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.titleRow}>
              <WindowAd24Regular style={{ color: '#818cf8', fontSize: '28px' }} />
              <Title2 style={{ margin: 0 }}>Recruiter Command Center</Title2>
              <Badge appearance="tint" color="brand">
                Live Node
              </Badge>
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Continuous talent intelligence, actionable pipeline stages, interview scheduling, and recruitment matching.
            </Caption1>
          </div>

          <div className={styles.headerActions}>
            <Link href="/candidates" style={{ textDecoration: 'none' }}>
              <Button appearance="secondary" icon={<PeopleRegular />}>
                Candidates
              </Button>
            </Link>

            <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
              <Button appearance="secondary" icon={<DocumentTextRegular />}>
                Jobs & Matching
              </Button>
            </Link>

            <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
              <Button appearance="secondary" icon={<CalendarRegular />}>
                Interviews
              </Button>
            </Link>

            <Button
              appearance="primary"
              icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
              disabled={loading || refreshing}
              onClick={handleRefresh}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Pipeline'}
            </Button>
          </div>
        </div>

        {/* Top-Level KPI Metric Cards */}
        <div>
          <KPICards data={kpis} isLoading={loading} />
        </div>

        {/* Recruiter Attention Center ("Needs Attention") */}
        <div>
          <RecruiterAttentionCenter
            candidates={candidates}
            interviews={interviews}
            jobs={jobs}
            isLoading={loading}
          />
        </div>

        {/* Command Center 2-Column Grid */}
        <div className={styles.commandGrid}>
          {/* Left Column: Upcoming Interviews + Priority Candidates */}
          <div className={styles.column}>
            <UpcomingInterviewsWidget
              interviews={interviews}
              isLoading={loading}
            />

            <PriorityCandidatesWidget
              candidates={candidates}
              isLoading={loading}
            />
          </div>

          {/* Right Column: Active Jobs + Recent Activity Feed */}
          <div className={styles.column}>
            <ActiveJobsWidget
              jobs={jobs}
              isLoading={loading}
            />

            <RecentActivityFeed
              events={timelineEvents}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Bottom Section: Pipeline Analytics & Talent Yield */}
        <div>
          <div className={styles.sectionTitle}>Talent Analytics & Yield</div>
          <AnalyticsSection
            candidates={candidates}
            collegeGroups={collegeGroups}
            scoreBuckets={scoreBuckets}
          />
        </div>
      </div>
    </MainLayout>
  );
}
