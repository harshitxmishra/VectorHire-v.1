'use client';

import { makeStyles, tokens, Body1, Body2 } from '@fluentui/react-components';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
    minHeight: '300px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px dashed ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: '32px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '400px',
  },
});

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <Body1 className={styles.title}>{title}</Body1>
        {description && <Body2 className={styles.description}>{description}</Body2>}
      </div>
    </div>
  );
}
