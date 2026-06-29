'use client';

import {
  Avatar,
  Badge,
  Body2,
  Body1Strong,
  Button,
  Input,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Alert24Regular,
  Dismiss12Regular,
  SearchRegular,
  Sparkle24Regular,
} from '@fluentui/react-icons';
import { useThemeMode } from '@/app/providers';
import { useState } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '80px',
    backgroundColor: 'rgba(8, 15, 30, 0.76)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalL,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    flex: 1,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: '220px',
  },
  pageTitle: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: 650,
    letterSpacing: '-0.02em',
  },
  pageMeta: {
    color: tokens.colorNeutralForeground3,
  },
  searchContainer: {
    flex: 1,
    maxWidth: '520px',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    minWidth: '100%',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    color: tokens.colorNeutralForeground2,
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      color: tokens.colorNeutralForeground1,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      backgroundColor: 'rgba(21, 32, 51, 0.96)',
    },
  },
  profileShell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalM,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  actionBadge: {
    backgroundColor: 'rgba(71, 108, 181, 0.14)',
    color: tokens.colorBrandForeground1,
    ...shorthands.borderColor('rgba(101, 147, 245, 0.2)'),
  },
});

export function Navbar() {
  const styles = useStyles();
  const { mode, setMode } = useThemeMode();
  const [searchValue, setSearchValue] = useState('');

  return (
    <nav className={styles.root}>
      <div className={styles.leftSection}>
        <div className={styles.titleBlock}>
          <div className={styles.pageTitle}>Talent Operations</div>
          <Body2 className={styles.pageMeta}>
            Premium recruiting workspace across sourcing, screening, and interviews
          </Body2>
        </div>

        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            contentBefore={<SearchRegular />}
            placeholder="Search candidates, campaigns, and evaluations"
            value={searchValue}
            onChange={(e, data) => setSearchValue(data.value)}
            contentAfter={
              searchValue ? (
                <Button
                  appearance="transparent"
                  size="small"
                  icon={<Dismiss12Regular />}
                  onClick={() => setSearchValue('')}
                />
              ) : undefined
            }
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <Badge appearance="outline" icon={<Sparkle24Regular />} className={styles.actionBadge}>
          AI workflows live
        </Badge>

        <button className={styles.iconButton} title="Notifications">
          <Alert24Regular />
        </button>

        <button
          className={styles.iconButton}
          title="Toggle theme"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? 'Dark' : 'Light'}
        </button>

        <div className={styles.profileShell}>
          <Avatar name="VectorHire Admin" size={36} color="brand" />
          <div className={styles.profileText}>
            <Body1Strong>Sujeet Mishra</Body1Strong>
            <Body2 className={styles.pageMeta}>Admin workspace</Body2>
          </div>
        </div>
      </div>
    </nav>
  );
}
