'use client';

import {
  Body2,
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
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow8,
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: 'rgba(21, 32, 51, 0.96)',
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow16,
      transform: 'translateY(-2px)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48px',
    minHeight: '48px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: 'rgba(71, 108, 181, 0.14)',
    color: tokens.colorBrandForeground1,
    border: '1px solid rgba(101, 147, 245, 0.16)',
  },
  value: {
    fontSize: '34px',
    lineHeight: '38px',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: tokens.colorNeutralForeground1,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  trend: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
  },
  trendUp: {
    color: tokens.colorStatusSuccessForeground1,
  },
  trendDown: {
    color: tokens.colorStatusDangerForeground1,
  },
  subtext: {
    color: tokens.colorNeutralForeground3,
  },
  skeleton: {
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusLarge,
    animationName: {
      '0%, 100%': {
        opacity: 0.6,
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
    height: '32px',
    marginBottom: tokens.spacingVerticalM,
  },
  skeletonLabel: {
    height: '16px',
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
            {trend.direction === 'up' ? 'Up' : 'Down'} {trend.value}%
          </span>
          <Body2 className={styles.subtext}>{trend.label}</Body2>
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
