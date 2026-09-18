'use client';

import { makeStyles, tokens } from '@fluentui/react-components';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '32px 24px',
    minHeight: '220px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground4,
    fontSize: '20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textAlign: 'center',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    maxWidth: '360px',
    lineHeight: '16px',
  },
  action: {
    marginTop: '8px',
  },
});

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
