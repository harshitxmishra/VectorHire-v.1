'use client';

import React from 'react';
import { makeStyles, tokens, Caption1, Badge } from '@fluentui/react-components';
import { CollegeGroup } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collegeName: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  barTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusCircular,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.borderRadiusCircular,
    background: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
    transition: 'width 0.8s ease',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

interface CollegeYieldChartProps {
  collegeGroups: CollegeGroup[];
}

export function CollegeYieldChart({ collegeGroups }: CollegeYieldChartProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {collegeGroups.slice(0, 6).map((group) => {
        const yieldPercent =
          group.totalCandidates > 0
            ? Math.round((group.shortlistedCount / group.totalCandidates) * 100)
            : 0;

        return (
          <div key={group.college} className={styles.card}>
            <div className={styles.header}>
              <span className={styles.collegeName}>{group.college}</span>
              <Badge appearance="tint" color="brand">
                Avg Score: {group.averageAIScore}%
              </Badge>
            </div>

            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${Math.max(yieldPercent, 3)}%` }}
              />
            </div>

            <div className={styles.metaRow}>
              <span>{group.totalCandidates} Candidates Processed</span>
              <span>
                <strong>{group.shortlistedCount} Shortlisted</strong> ({yieldPercent}% Shortlist Yield)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
