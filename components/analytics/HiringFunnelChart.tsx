'use client';

import React from 'react';
import { makeStyles, tokens, Caption1, Body2 } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  stageRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageName: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  stageCount: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase300,
    color: '#818cf8',
  },
  barTrack: {
    width: '100%',
    height: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.borderRadiusSmall,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '8px',
  },
  dropoffBadge: {
    position: 'absolute',
    right: '8px',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
});

interface FunnelStage {
  stage: string;
  count: number;
}

interface HiringFunnelChartProps {
  stages: FunnelStage[];
}

const STAGE_GRADIENTS = [
  'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
  'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
  'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)',
  'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
  'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
];

export function HiringFunnelChart({ stages }: HiringFunnelChartProps) {
  const styles = useStyles();
  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const baseCount = stages[0]?.count || 1;

  return (
    <div className={styles.container}>
      {stages.map((stage, idx) => {
        const percentage = Math.round((stage.count / maxCount) * 100);
        const conversionFromTop = Math.round((stage.count / baseCount) * 100);
        const gradient = STAGE_GRADIENTS[idx % STAGE_GRADIENTS.length];

        return (
          <div key={stage.stage} className={styles.stageRow}>
            <div className={styles.stageHeader}>
              <span className={styles.stageName}>{stage.stage}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={styles.stageCount}>{stage.count}</span>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  ({conversionFromTop}% yield)
                </Caption1>
              </div>
            </div>

            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.max(percentage, 4)}%`,
                  background: gradient,
                }}
              />
              <span className={styles.dropoffBadge}>
                {idx > 0 && stages[idx - 1].count > 0
                  ? `${Math.round((stage.count / stages[idx - 1].count) * 100)}% pass-through`
                  : '100% Inflow'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
