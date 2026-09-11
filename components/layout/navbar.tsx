'use client';

import React, { useState } from 'react';
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
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuDivider,
  Caption1,
} from '@fluentui/react-components';
import {
  Alert24Regular,
  Dismiss12Regular,
  SearchRegular,
  Sparkle24Regular,
  SignOut20Regular,
  Settings20Regular,
  Person20Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
} from '@fluentui/react-icons';
import { useThemeMode } from '@/app/providers';
import { useAuth } from '@/lib/context/auth-context';
import Link from 'next/link';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '76px',
    backgroundColor: 'rgba(8, 15, 30, 0.82)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalL,
    position: 'sticky',
    top: 0,
    zIndex: 20,
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
    gap: '2px',
    minWidth: '200px',
  },
  pageTitle: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  pageMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  searchContainer: {
    flex: 1,
    maxWidth: '480px',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    minWidth: '100%',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: '38px',
    height: '38px',
    borderRadius: tokens.borderRadiusMedium,
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
  profileTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'transparent'),
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      ...shorthands.borderColor(tokens.colorNeutralStroke2),
    },
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  actionBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    color: '#a5b4fc',
    ...shorthands.borderColor('rgba(129, 140, 248, 0.25)'),
  },
  popoverCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minWidth: '220px',
  },
});

export function Navbar() {
  const styles = useStyles();
  const { mode, setMode } = useThemeMode();
  const { user, signOut, workspaceName } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const displayName = user?.name || 'Recruiting Admin';
  const displayRole = user?.role || 'Talent Operations';

  return (
    <nav className={styles.root}>
      <div className={styles.leftSection}>
        <div className={styles.titleBlock}>
          <div className={styles.pageTitle}>Talent Operations</div>
          <Body2 className={styles.pageMeta}>
            {workspaceName} • AI Screening & Interview Engine
          </Body2>
        </div>

        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            contentBefore={<SearchRegular />}
            placeholder="Search candidates, campaigns, or skill match..."
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
          AI active
        </Badge>

        <button
          className={styles.iconButton}
          title="Toggle theme"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? <WeatherMoon20Regular /> : <WeatherSunny20Regular />}
        </button>

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button className={styles.profileTrigger}>
              <Avatar name={displayName} size={36} color="brand" />
              <div className={styles.profileText}>
                <Body1Strong style={{ fontSize: '13px', lineHeight: '16px' }}>
                  {displayName}
                </Body1Strong>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  {displayRole}
                </Caption1>
              </div>
            </button>
          </MenuTrigger>

          <MenuPopover>
            <div className={styles.popoverCard}>
              <Body1Strong>{displayName}</Body1Strong>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {user?.email || 'admin@vectorhire.ai'}
              </Caption1>
            </div>
            <MenuDivider />
            <MenuList>
              <Link href="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
                <MenuItem icon={<Settings20Regular />}>Settings & API Keys</MenuItem>
              </Link>
              <MenuItem
                icon={mode === 'light' ? <WeatherMoon20Regular /> : <WeatherSunny20Regular />}
                onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              >
                Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<SignOut20Regular />} onClick={() => signOut()}>
                Sign Out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </nav>
  );
}
