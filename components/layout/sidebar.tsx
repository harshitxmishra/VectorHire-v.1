'use client';

import {
  Avatar,
  Body2,
  Caption1,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Briefcase20Regular,
  CalendarAgenda20Regular,
  ChartMultiple20Regular,
  Code20Regular,
  DocumentText20Regular,
  People20Regular,
  Settings20Regular,
  Sparkle20Regular,
  TargetArrow20Regular,
  WindowAd20Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/context/auth-context';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '256px',
    minWidth: '256px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '12px',
    paddingRight: '12px',
    gap: '20px',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  brandBadge: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '-0.02em',
  },
  brandTitle: {
    fontSize: '15px',
    fontWeight: 650,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  versionTag: {
    fontSize: '11px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    paddingLeft: '6px',
    paddingRight: '6px',
    paddingTop: '2px',
    paddingBottom: '2px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground4,
  },
  workspaceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '6px',
    paddingBottom: '6px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  workspaceInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  workspaceName: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  workspaceStatus: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    paddingLeft: '10px',
    paddingTop: '6px',
    paddingBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  bottomPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bottomLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  bottomMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '15px',
  },
});

interface NavItemConfig {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItemConfig[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <WindowAd20Regular /> },
  { label: 'Campaigns', href: '/hiring-campaigns', icon: <TargetArrow20Regular /> },
  { label: 'Candidates', href: '/candidates', icon: <People20Regular /> },
  { label: 'Job Descriptions', href: '/job-descriptions', icon: <DocumentText20Regular /> },
  { label: 'AI Evaluation', href: '/ai-evaluation', icon: <Sparkle20Regular /> },
  { label: 'GitHub Insights', href: '/github-insights', icon: <Code20Regular /> },
  { label: 'Assessments', href: '/assessments', icon: <Briefcase20Regular /> },
  {
    label: 'Interview Schedule',
    href: '/interview-scheduling',
    icon: <CalendarAgenda20Regular />,
  },
  { label: 'Analytics', href: '/analytics', icon: <ChartMultiple20Regular /> },
];

const settingsItems: NavItemConfig[] = [
  { label: 'Settings', href: '/settings', icon: <Settings20Regular /> },
];

export function Sidebar() {
  const styles = useStyles();
  const pathname = usePathname();
  const { workspaceName } = useAuth();

  return (
    <aside className={styles.root}>
      {/* Brand & Workspace Header */}
      <div className={styles.brandHeader}>
        <Link href="/dashboard" className={styles.brandGroup}>
          <div className={styles.brandBadge}>V</div>
          <span className={styles.brandTitle}>VectorHire</span>
        </Link>
        <span className={styles.versionTag}>v1.0</span>
      </div>

      <div className={styles.workspaceSection}>
        <Avatar
          initials={workspaceName ? workspaceName.slice(0, 2).toUpperCase() : 'VH'}
          color="brand"
          size={24}
        />
        <div className={styles.workspaceInfo}>
          <span className={styles.workspaceName}>{workspaceName || 'Recruiting Workspace'}</span>
          <span className={styles.workspaceStatus}>Active Talent Node</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={styles.navSection}>
        <div className={styles.navLabel}>Menu</div>
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

      {/* Settings Navigation */}
      <nav className={styles.navSection}>
        <div className={styles.navLabel}>System</div>
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

      {/* Understated Pipeline Status Panel */}
      <div className={styles.bottomPanel}>
        <span className={styles.bottomLabel}>Continuous Intelligence</span>
        <span className={styles.bottomMeta}>
          Continuous AI talent scoring, async queue workers & match ranking.
        </span>
      </div>
    </aside>
  );
}

const useNavItemStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '7px',
    paddingBottom: '7px',
    borderRadius: tokens.borderRadiusMedium,
    textDecoration: 'none',
    color: tokens.colorNeutralForeground2,
    fontSize: '13px',
    fontWeight: 450,
    cursor: 'pointer',
    ...shorthands.border('1px', 'solid', 'transparent'),
    transition: `background-color ${tokens.durationFast} ${tokens.curveEasyEase}, color ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  active: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
    ...shorthands.borderColor(tokens.colorNeutralStroke2),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1,
      color: tokens.colorBrandForeground1,
    },
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: 'inherit',
  },
  label: {
    flex: 1,
    whiteSpace: 'nowrap',
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
