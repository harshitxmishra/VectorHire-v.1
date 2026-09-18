'use client';

import {
  Button,
  Caption1,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ArrowDownload16Regular } from '@fluentui/react-icons';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: `border-color ${tokens.durationFast} ${tokens.curveEasyEase}`,
    ':hover': {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  caption: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  content: {
    minHeight: '260px',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
  },
});

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onExport?: () => void;
  exportable?: boolean;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  onExport,
  exportable = false,
}: ChartContainerProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.title}>{title}</span>
          {subtitle ? (
            <Caption1 className={styles.caption}>{subtitle}</Caption1>
          ) : null}
        </div>
        {exportable && (
          <Button
            appearance="subtle"
            size="small"
            onClick={onExport}
            icon={<ArrowDownload16Regular />}
          >
            Export
          </Button>
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
