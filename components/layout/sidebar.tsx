'use client';

import {
  Avatar,
  Body2,
  Body1Strong,
  Caption1,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Briefcase24Regular,
  CalendarAgenda24Regular,
  ChartMultiple24Regular,
  Code24Regular,
  DocumentText24Regular,
  People24Regular,
  Settings24Regular,
  Sparkle24Regular,
  TargetArrow24Regular,
  WindowAd24Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '276px',
    minWidth: '276px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    height: '100vh',
    overflowY: 'auto',
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingVerticalL,
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
  },
  logoMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  logoBrand: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
  },
  workspaceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2Hover,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  workspaceText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  navLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    paddingLeft: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  bottomPanel: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bottomLabel: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  bottomMeta: {
    color: tokens.colorNeutralForeground3,
  },
});

interface NavItemConfig {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItemConfig[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <WindowAd24Regular /> },
  { label: 'Campaigns', href: '/hiring-campaigns', icon: <TargetArrow24Regular /> },
  { label: 'Candidates', href: '/candidates', icon: <People24Regular /> },
  { label: 'Job Descriptions', href: '/job-descriptions', icon: <DocumentText24Regular /> },
  { label: 'AI Evaluation', href: '/ai-evaluation', icon: <Sparkle24Regular /> },
  { label: 'GitHub Insights', href: '/github-insights', icon: <Code24Regular /> },
  { label: 'Assessments', href: '/assessments', icon: <Briefcase24Regular /> },
  {
    label: 'Interview Schedule',
    href: '/interview-scheduling',
    icon: <CalendarAgenda24Regular />,
  },
  { label: 'Analytics', href: '/analytics', icon: <ChartMultiple24Regular /> },
];

const settingsItems: NavItemConfig[] = [
  { label: 'Settings', href: '/settings', icon: <Settings24Regular /> },
];

import { useAuth } from '@/lib/context/auth-context';

export function Sidebar() {
  const styles = useStyles();
  const pathname = usePathname();
  const { workspaceName } = useAuth();

  return (
    <aside className={styles.root}>
      <div className={styles.logo}>
        <div className={styles.logoMeta}>
          <Link href="/dashboard" className={styles.logoBrand}>
            VectorHire
          </Link>
          <Caption1 style={{ color: '#818cf8', fontWeight: 600 }}>v1.0</Caption1>
        </div>

        <div className={styles.workspaceCard}>
          <Avatar initials={workspaceName ? workspaceName.slice(0, 2).toUpperCase() : 'VH'} color="brand" size={40} />
          <div className={styles.workspaceText}>
            <Body1Strong style={{ fontSize: '13px' }}>{workspaceName || 'Recruiting Workspace'}</Body1Strong>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Active Talent Node</Caption1>
          </div>
        </div>
      </div>

      <nav className={styles.navSection}>
        <div className={styles.navLabel}>Main</div>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href || pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <nav className={styles.navSection}>
        <div className={styles.navLabel}>Settings</div>
        {settingsItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className={styles.bottomPanel}>
        <Body2 className={styles.bottomLabel}>Pipeline Health</Body2>
        <Caption1 className={styles.bottomMeta}>
          Keep candidate quality, campaign velocity, and interview scheduling aligned in one workspace.
        </Caption1>
      </div>
    </aside>
  );
}

const useNavItemStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusLarge,
    textDecoration: 'none',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    fontWeight: 500,
    cursor: 'pointer',
    ...shorthands.border('1px', 'solid', 'transparent'),
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
      ...shorthands.borderColor(tokens.colorNeutralStroke2),
      transform: 'translateX(2px)',
    },
  },
  active: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    boxShadow: tokens.shadow2,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    color: tokens.colorBrandForeground1,
  },
  label: {
    flex: 1,
  },
});

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: ReactNode;
  isActive?: boolean;
}

function SidebarNavItem({ label, href, icon, isActive }: SidebarNavItemProps) {
  const styles = useNavItemStyles();

  return (
    <Link
      href={href}
      className={`${styles.root} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
