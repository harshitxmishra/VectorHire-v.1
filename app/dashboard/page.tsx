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
  Button,
  MessageBar,
  MessageBarBody,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  People16Regular,
  DocumentText16Regular,
  Calendar16Regular,
  WindowAd20Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { useAppData } from '@/lib/hooks/use-app-data';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useState } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  bannerTitle: {
    fontSize: '18px',
    fontWeight: 650,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  bannerSubtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    fontSize: '12px',
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    marginBottom: '4px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
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
              <WindowAd20Regular style={{ color: tokens.colorBrandForeground1 }} />
              <span className={styles.bannerTitle}>Recruiter Command Center</span>
              <Badge appearance="tint" color="brand">
                Live Node
              </Badge>
            </div>
            <span className={styles.bannerSubtitle}>
              Continuous talent intelligence, pipeline stages, interview coordination, and AI skill matching.
            </span>
          </div>

          <div className={styles.headerActions}>
            <Link href="/candidates" style={{ textDecoration: 'none' }}>
              <Button size="small" appearance="secondary" icon={<People16Regular />} className={styles.actionButton}>
                Candidates
              </Button>
            </Link>

            <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
              <Button size="small" appearance="secondary" icon={<DocumentText16Regular />} className={styles.actionButton}>
                Jobs & Matching
              </Button>
            </Link>

            <Link href="/interview-scheduling" style={{ textDecoration: 'none' }}>
              <Button size="small" appearance="secondary" icon={<Calendar16Regular />} className={styles.actionButton}>
                Interviews
              </Button>
            </Link>

            <Button
              size="small"
              appearance="primary"
              icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwise16Regular />}
              disabled={loading || refreshing}
              onClick={handleRefresh}
              className={styles.actionButton}
            >
              {refreshing ? 'Syncing...' : 'Sync Pipeline'}
            </Button>
          </div>
        </div>

        {/* Primary KPI Metric Strip */}
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

        {/* 2-Column Command Grid */}
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
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Talent Analytics & Yield Distribution</span>
          </div>
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
