'use client';

import { makeStyles, tokens } from '@fluentui/react-components';
import { StatCard } from '@/components/ui/stat-card';
import { KPIData } from '@/lib/types';
import {
  People24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  Star24Regular,
  Trophy24Regular,
  BuildingBank24Regular,
  MailRegular,
  TaskListSquareLtr24Regular,
  CalendarAgenda24Regular,
  MoneyRegular,
  ArrowTrendingRegular,
  CalendarWeekStart24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXL,
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    },
  },
});

interface KPICardsProps {
  data: KPIData;
  isLoading?: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const styles = useStyles();

  const cards = [
    {
      title: 'Total Candidates',
      value: data.totalCandidates,
      icon: <People24Regular />,
      tooltip: 'All candidates across all campaigns',
    },
    {
      title: 'Shortlisted',
      value: data.shortlisted,
      icon: <CheckmarkCircle24Regular />,
      tooltip: 'Candidates moved to shortlist stage',
    },
    {
      title: 'Pending Review',
      value: data.pendingReview,
      icon: <Clock24Regular />,
      tooltip: 'Candidates awaiting next step',
    },
    {
      title: 'Average AI Score',
      value: `${data.averageAIScore}%`,
      icon: <Star24Regular />,
      tooltip: 'Average AI match score across all candidates',
    },
    {
      title: 'High Scorers',
      value: data.highScorers,
      icon: <Trophy24Regular />,
      tooltip: 'Candidates with an AI score of 85 or higher',
    },
    {
      title: 'Top College',
      value: data.topCollege,
      icon: <BuildingBank24Regular />,
      tooltip: 'College with the most applicants',
    },
    {
      title: 'Assessments Pending',
      value: data.assessmentsPending,
      icon: <MailRegular />,
      tooltip: 'Assessments sent, awaiting completion',
    },
    {
      title: 'Assessments Completed',
      value: data.assessmentsCompleted,
      icon: <TaskListSquareLtr24Regular />,
      tooltip: 'Candidates with completed assessments',
    },
    {
      title: 'Upcoming Interviews',
      value: data.upcomingInterviews,
      icon: <CalendarAgenda24Regular />,
      tooltip: 'Interviews scheduled in the future',
    },
    {
      title: 'Interviews This Week',
      value: data.interviewsThisWeek,
      icon: <CalendarWeekStart24Regular />,
      tooltip: 'Interviews scheduled in the next 7 days',
    },
    {
      title: 'Offers',
      value: data.offers,
      icon: <MoneyRegular />,
      tooltip: 'Candidates with an offer extended',
    },
    {
      title: 'Hire Rate',
      value: `${data.hireRate}%`,
      icon: <ArrowTrendingRegular />,
      tooltip: 'Percentage of candidates hired',
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
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
  );
}
