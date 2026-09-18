'use client';

import { makeStyles, Button, tokens } from '@fluentui/react-components';
import { StatCard } from '@/components/ui/stat-card';
import { KPIData } from '@/lib/types';
import {
  People16Regular,
  CheckmarkCircle16Regular,
  Clock16Regular,
  Star16Regular,
  Trophy16Regular,
  BuildingBank16Regular,
  Mail16Regular,
  Calendar16Regular,
  ArrowTrending16Regular,
  ChevronDown16Regular,
  ChevronUp16Regular,
} from '@fluentui/react-icons';
import { useState } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  toggleButton: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
});

interface KPICardsProps {
  data: KPIData;
  isLoading?: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const styles = useStyles();
  const [showAll, setShowAll] = useState(false);

  const primaryCards = [
    {
      title: 'Total Pipeline',
      value: data.totalCandidates,
      icon: <People16Regular />,
      tooltip: 'All candidate profiles active in workspace',
    },
    {
      title: 'Shortlisted',
      value: data.shortlisted,
      icon: <CheckmarkCircle16Regular />,
      tooltip: 'Candidates qualified and advanced to shortlist',
    },
    {
      title: 'Pending Review',
      value: data.pendingReview,
      icon: <Clock16Regular />,
      tooltip: 'Applicants awaiting recruiter action',
    },
    {
      title: 'Avg AI Match',
      value: `${data.averageAIScore}%`,
      icon: <Star16Regular />,
      tooltip: 'Mean automated match score across current candidates',
    },
  ];

  const secondaryCards = [
    {
      title: 'Top Scorers (85%+)',
      value: data.highScorers,
      icon: <Trophy16Regular />,
      tooltip: 'Candidates meeting high technical benchmark',
    },
    {
      title: 'Interviews Scheduled',
      value: data.upcomingInterviews,
      icon: <Calendar16Regular />,
      tooltip: 'Upcoming interview sessions',
    },
    {
      title: 'Assessments Pending',
      value: data.assessmentsPending,
      icon: <Mail16Regular />,
      tooltip: 'Candidates with dispatched assessments',
    },
    {
      title: 'Pipeline Yield',
      value: `${data.hireRate}%`,
      icon: <ArrowTrending16Regular />,
      tooltip: 'Conversion rate from applicant to hire',
    },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.primaryGrid}>
        {primaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tooltip={card.tooltip}
            isLoading={isLoading}
          />
        ))}
      </div>

      {showAll && (
        <div className={styles.secondaryGrid}>
          {secondaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              tooltip={card.tooltip}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      <div className={styles.toggleRow}>
        <Button
          appearance="subtle"
          size="small"
          className={styles.toggleButton}
          icon={showAll ? <ChevronUp16Regular /> : <ChevronDown16Regular />}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show fewer metrics' : 'Show operational metrics (4 more)'}
        </Button>
      </div>
    </div>
  );
}
