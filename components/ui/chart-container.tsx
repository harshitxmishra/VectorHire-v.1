'use client';

import {
  Body1Strong,
  Button,
  Caption1,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow8,
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow16,
      transform: 'translateY(-2px)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 650,
    letterSpacing: '-0.01em',
    color: tokens.colorNeutralForeground1,
  },
  caption: {
    color: tokens.colorNeutralForeground3,
  },
  content: {
    minHeight: '300px',
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
          <Body1Strong className={styles.title}>{title}</Body1Strong>
          {subtitle ? (
            <Caption1 className={styles.caption}>{subtitle}</Caption1>
          ) : null}
        </div>
        {exportable && (
          <Button
            appearance="subtle"
            size="small"
            onClick={onExport}
            icon={<ArrowDownload24Regular />}
          >
            Export
          </Button>
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
