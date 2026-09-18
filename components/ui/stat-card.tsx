'use client';

import {
  Caption1,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: `border-color ${tokens.durationFast} ${tokens.curveEasyEase}, background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorBrandForeground1,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  value: {
    fontSize: '24px',
    lineHeight: '28px',
    fontWeight: 650,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  trend: {
    fontSize: '11px',
    fontWeight: 600,
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: '1px',
    paddingBottom: '1px',
    borderRadius: tokens.borderRadiusSmall,
  },
  trendUp: {
    color: tokens.colorStatusSuccessForeground1,
    backgroundColor: tokens.colorStatusSuccessBackground1,
  },
  trendDown: {
    color: tokens.colorStatusDangerForeground1,
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  subtext: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  skeleton: {
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusSmall,
    animationName: {
      '0%, 100%': {
        opacity: 0.5,
      },
      '50%': {
        opacity: 1,
      },
    },
    animationDuration: '1.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  skeletonValue: {
    height: '24px',
    width: '60%',
    marginBottom: '8px',
  },
  skeletonLabel: {
    height: '12px',
    width: '40%',
  },
});

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  tooltip?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  tooltip,
  isLoading,
}: StatCardProps) {
  const styles = useStyles();

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
      </div>
    );
  }

  const content = (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <Caption1 className={styles.label}>{title}</Caption1>
          <div className={styles.value}>{value}</div>
        </div>
        {icon ? <div className={styles.icon}>{icon}</div> : null}
      </div>
      {trend ? (
        <div className={styles.footer}>
          <span
            className={`${styles.trend} ${
              trend.direction === 'up' ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
          <span className={styles.subtext}>{trend.label}</span>
        </div>
      ) : null}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} relationship="label">
        {content}
      </Tooltip>
    );
  }

  return content;
}
