'use client';

import React from 'react';
import { makeStyles, tokens, Caption1 } from '@fluentui/react-components';
import { ScoreBucket } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  label: {
    minWidth: '75px',
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  track: {
    flex: 1,
    height: '20px',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: tokens.borderRadiusSmall,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  count: {
    minWidth: '35px',
    textAlign: 'right',
    fontSize: tokens.fontSizeBase200,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
});

interface ScoreDistributionChartProps {
  scoreBuckets: ScoreBucket[];
}

const BUCKET_COLORS: Record<string, string> = {
  '90-100%': 'linear-gradient(90deg, #10b981, #34d399)',
  '80-89%': 'linear-gradient(90deg, #3b82f6, #60a5fa)',
  '70-79%': 'linear-gradient(90deg, #6366f1, #818cf8)',
  '60-69%': 'linear-gradient(90deg, #eab308, #facc15)',
  '< 60%': 'linear-gradient(90deg, #ef4444, #f87171)',
};

export function ScoreDistributionChart({ scoreBuckets }: ScoreDistributionChartProps) {
  const styles = useStyles();
  const maxBucketCount = Math.max(1, ...scoreBuckets.map((b) => b.count));

  return (
    <div className={styles.container}>
      {scoreBuckets.map((bucket) => {
        const percentage = Math.round((bucket.count / maxBucketCount) * 100);
        const color = BUCKET_COLORS[bucket.label] || 'linear-gradient(90deg, #6366f1, #818cf8)';

        return (
          <div key={bucket.label} className={styles.row}>
            <span className={styles.label}>{bucket.label}</span>
            <div className={styles.track}>
              <div
                className={styles.bar}
                style={{
                  width: `${Math.max(percentage, bucket.count > 0 ? 4 : 0)}%`,
                  background: color,
                }}
              />
            </div>
            <span className={styles.count}>{bucket.count}</span>
          </div>
        );
      })}
    </div>
  );
}
