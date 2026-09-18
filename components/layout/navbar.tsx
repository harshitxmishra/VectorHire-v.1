'use client';

import React, { useState } from 'react';
import {
  Avatar,
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
  Tooltip,
} from '@fluentui/react-components';
import {
  Dismiss12Regular,
  SearchRegular,
  SignOut20Regular,
  Settings20Regular,
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
    minHeight: '54px',
    maxHeight: '54px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: '24px',
    paddingRight: '24px',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    flexShrink: 0,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: 0,
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 'fit-content',
  },
  pageTitle: {
    color: tokens.colorNeutralForeground1,
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
  },
  metaBadge: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingLeft: '6px',
    paddingRight: '6px',
    paddingTop: '2px',
    paddingBottom: '2px',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  searchContainer: {
    flex: 1,
    maxWidth: '420px',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: '13px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ':focus-within': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  searchShortcut: {
    fontSize: '10px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: '1px',
    paddingBottom: '1px',
    borderRadius: tokens.borderRadiusSmall,
    marginRight: '2px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  themeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    transition: `background-color ${tokens.durationFast}, color ${tokens.durationFast}, border-color ${tokens.durationFast}`,
    ':hover': {
      color: tokens.colorNeutralForeground1,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  profileTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'transparent'),
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: `background-color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke2),
    },
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '13px',
  },
  profileName: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  profileRole: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
  },
  popoverCard: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px',
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
          <span className={styles.pageTitle}>Talent Intelligence</span>
          <span className={styles.metaBadge}>{workspaceName || 'Live Workspace'}</span>
        </div>

        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            contentBefore={<SearchRegular style={{ fontSize: '15px' }} />}
            placeholder="Search candidates, skills, campaigns..."
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
              ) : (
                <span className={styles.searchShortcut}>⌘K</span>
              )
            }
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <Tooltip content={mode === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'} relationship="label">
          <button
            className={styles.themeButton}
            aria-label="Toggle theme"
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            {mode === 'light' ? <WeatherMoon20Regular /> : <WeatherSunny20Regular />}
          </button>
        </Tooltip>

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button className={styles.profileTrigger}>
              <Avatar name={displayName} size={28} color="brand" />
              <div className={styles.profileText}>
                <span className={styles.profileName}>{displayName}</span>
                <span className={styles.profileRole}>{displayRole}</span>
              </div>
            </button>
          </MenuTrigger>

          <MenuPopover>
            <div className={styles.popoverCard}>
              <span style={{ fontSize: '13px', fontWeight: 650, color: tokens.colorNeutralForeground1 }}>
                {displayName}
              </span>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {user?.email || 'admin@vectorhire.ai'}
              </Caption1>
            </div>
            <MenuDivider />
            <MenuList>
              <Link href="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
                <MenuItem icon={<Settings20Regular />}>Workspace Settings & APIs</MenuItem>
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
