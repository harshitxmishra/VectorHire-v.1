'use client';

import React from 'react';
import Link from 'next/link';
import {
  makeStyles,
  tokens,
  shorthands,
  Title1,
  Title2,
  Title3,
  Subtitle1,
  Subtitle2,
  Body1,
  Body2,
  Caption1,
  Button,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import {
  Sparkle24Regular,
  ArrowRight20Filled,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
  Person20Regular,
  ShieldCheckmark20Regular,
  ChartMultiple20Regular,
  CalendarLtr20Regular,
  Code20Regular,
  Bot20Regular,
  Clock20Regular,
  CheckmarkCircle20Regular,
  ArrowTrending20Regular,
  Star20Regular,
  DocumentText20Regular,
  BuildingBank20Regular,
} from '@fluentui/react-icons';
import { useThemeMode } from '@/app/providers';
import {
  PREVIEW_METRICS,
  PREVIEW_ACTION_ITEMS,
  PREVIEW_CANDIDATES,
  PREVIEW_AI_EVALUATION,
  PREVIEW_PIPELINE,
  PREVIEW_INTERVIEWS,
  PREVIEW_CAPABILITIES,
} from '@/lib/preview/preview-data';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  header: {
    height: '56px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '28px',
    paddingRight: '28px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: 'inherit',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
  },
  brandName: {
    fontSize: '17px',
    fontWeight: 750,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  previewBadge: {
    marginLeft: '8px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    '@media (max-width: 860px)': {
      display: 'none',
    },
  },
  navLink: {
    color: tokens.colorNeutralForeground3,
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase300,
    fontWeight: 500,
    transition: `color ${tokens.durationFast}`,
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  themeButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '80px',
  },
  section: {
    width: '100%',
    maxWidth: '1200px',
    paddingLeft: '24px',
    paddingRight: '24px',
    marginTop: '60px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroSection: {
    marginTop: '50px',
    marginBottom: '30px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '860px',
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '4px',
    paddingBottom: '4px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    color: tokens.colorBrandForeground1,
    fontSize: '12px',
    fontWeight: 600,
  },
  heroTitle: {
    fontSize: '44px',
    lineHeight: '1.15',
    fontWeight: 850,
    letterSpacing: '-0.03em',
    color: tokens.colorNeutralForeground1,
    '@media (max-width: 600px)': {
      fontSize: '32px',
    },
  },
  heroSubtitle: {
    fontSize: '17px',
    lineHeight: '1.5',
    color: tokens.colorNeutralForeground3,
    maxWidth: '680px',
  },
  heroCtaGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginTop: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  metricCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 750,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  metricLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
  },
  metricFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: tokens.colorStatusSuccessForeground1,
    fontWeight: 600,
  },
  actionItemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  actionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  candidateCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    '@media (max-width: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
  candidateCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: `border-color ${tokens.durationFast}`,
    ':hover': {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  candidateHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  candidateIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  candidateAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusCircular,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '15px',
  },
  matchScoreBadge: {
    padding: '4px 10px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    color: tokens.colorBrandForeground1,
    fontWeight: 700,
    fontSize: '14px',
  },
  skillPillGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  skillPill: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    color: tokens.colorNeutralForeground2,
    fontWeight: 500,
  },
  evaluationPanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  evaluationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    '@media (max-width: 700px)': {
      gridTemplateColumns: '1fr',
    },
  },
  evalCriterion: {
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  pipelineBar: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  pipelineColumn: {
    flex: 1,
    minWidth: '160px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'center',
  },
  capabilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
    '@media (max-width: 960px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  capabilityCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ctaBox: {
    width: '100%',
    maxWidth: '1200px',
    marginTop: '70px',
    padding: '48px 32px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  footer: {
    marginTop: '60px',
    paddingTop: '24px',
    paddingBottom: '24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: '12px',
  },
});

export default function PublicPreviewPage() {
  const styles = useStyles();
  const { mode, setMode } = useThemeMode();

  return (
    <div className={styles.root}>
      {/* 1. Public Top Navigation */}
      <header className={styles.header}>
        <Link href="/preview" className={styles.brandArea}>
          <div className={styles.logoIcon}>V</div>
          <span className={styles.brandName}>VectorHire</span>
          <Badge appearance="tint" color="informative" className={styles.previewBadge}>
            Live Preview
          </Badge>
        </Link>

        <nav className={styles.navLinks}>
          <a href="#command-center" className={styles.navLink}>Command Center</a>
          <a href="#candidates" className={styles.navLink}>Candidates</a>
          <a href="#ai-engine" className={styles.navLink}>AI Engine</a>
          <a href="#pipeline" className={styles.navLink}>Pipeline</a>
          <a href="#capabilities" className={styles.navLink}>Capabilities</a>
        </nav>

        <div className={styles.headerActions}>
          <Tooltip content={mode === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'} relationship="label">
            <button
              className={styles.themeButton}
              aria-label="Toggle theme"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            >
              {mode === 'light' ? <WeatherMoon20Regular /> : <WeatherSunny20Regular />}
            </button>
          </Tooltip>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button appearance="secondary" size="small">
              Sign In
            </Button>
          </Link>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button appearance="primary" size="small" icon={<ArrowRight20Filled />} iconPosition="after">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Main Public Showcase Content */}
      <main className={styles.mainContent}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.heroPill}>
            <Sparkle24Regular style={{ fontSize: '14px' }} />
            <span>Autonomous AI Talent Intelligence Platform</span>
          </div>
          <h1 className={styles.heroTitle}>
            High-Precision Candidate Matching & Recruiting Operations
          </h1>
          <p className={styles.heroSubtitle}>
            VectorHire matches job requirements to talent profiles with semantic vector embeddings,
            autonomous code repository audits, and synchronized interview operations.
          </p>
          <div className={styles.heroCtaGroup}>
            <a href="#command-center" style={{ textDecoration: 'none' }}>
              <Button appearance="primary" size="large" icon={<ArrowRight20Filled />} iconPosition="after">
                Explore Product Tour
              </Button>
            </a>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button appearance="secondary" size="large">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </section>

        {/* SECTION 2: COMMAND CENTER */}
        <section id="command-center" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Recruiter Command Center</h2>
              <span className={styles.sectionSubtitle}>
                Real-time operational health, volume metrics, and autonomous screening benchmarks.
              </span>
            </div>
            <Badge appearance="outline" color="subtle">
              Sample Workspace Data
            </Badge>
          </div>

          <div className={styles.cardGrid}>
            {PREVIEW_METRICS.map((metric) => (
              <div key={metric.title} className={styles.metricCard}>
                <span className={styles.metricLabel}>{metric.title}</span>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricFooter}>
                  <ArrowTrending20Regular /> {metric.change}
                </span>
                <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                  {metric.description}
                </Caption1>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: ATTENTION TRIAGE */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Recruiter Action Center</h2>
              <span className={styles.sectionSubtitle}>
                Action-first workflow queue prioritizing candidates requiring prompt recruiter decision.
              </span>
            </div>
            <Badge appearance="tint" color="brand">Triage Queue</Badge>
          </div>

          <div className={styles.actionItemsGrid}>
            {PREVIEW_ACTION_ITEMS.map((item) => (
              <div key={item.id} className={styles.actionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge appearance="tint" color={item.urgency === 'high' ? 'danger' : 'informative'}>
                    {item.category}
                  </Badge>
                  <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>Urgent</Caption1>
                </div>
                <Subtitle2 style={{ color: tokens.colorNeutralForeground1, fontWeight: 650 }}>
                  {item.title}
                </Subtitle2>
                <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                  Target: <strong>{item.candidate}</strong>
                </Body2>
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <Button size="small" appearance="subtle" icon={<ArrowRight20Filled />} iconPosition="after">
                    {item.actionText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: CANDIDATE INTELLIGENCE */}
        <section id="candidates" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Candidate Intelligence Workspace</h2>
              <span className={styles.sectionSubtitle}>
                Multi-dimensional candidate scoring extracted from verified resumes, transcripts, and repositories.
              </span>
            </div>
            <Badge appearance="outline" color="subtle">Fictional Profiles</Badge>
          </div>

          <div className={styles.candidateCardGrid}>
            {PREVIEW_CANDIDATES.map((cand) => (
              <div key={cand.id} className={styles.candidateCard}>
                <div className={styles.candidateHeader}>
                  <div className={styles.candidateIdentity}>
                    <div className={styles.candidateAvatar} style={{ backgroundColor: cand.avatarBg }}>
                      {cand.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: tokens.colorNeutralForeground1 }}>
                        {cand.name}
                      </div>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        {cand.role} • {cand.education}
                      </Caption1>
                    </div>
                  </div>
                  <div className={styles.matchScoreBadge}>
                    {cand.matchScore}% Match
                  </div>
                </div>

                <Body2 style={{ color: tokens.colorNeutralForeground2, fontSize: '13px' }}>
                  {cand.highlight}
                </Body2>

                <div className={styles.skillPillGroup}>
                  {cand.skills.map((skill) => (
                    <span key={skill} className={styles.skillPill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${tokens.colorNeutralStroke3}` }}>
                  <Badge appearance="tint" color={cand.status === 'Offer Sent' ? 'success' : 'informative'}>
                    {cand.status}
                  </Badge>
                  <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                    {cand.experience}
                  </Caption1>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: AI DEEP MATCH EVALUATION */}
        <section id="ai-engine" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>AI Match Intelligence Engine</h2>
              <span className={styles.sectionSubtitle}>
                Transparent breakdown of technical competencies, system experience, and hiring recommendations.
              </span>
            </div>
            <Badge appearance="tint" color="brand">AI Analysis Sample</Badge>
          </div>

          <div className={styles.evaluationPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <Subtitle1 style={{ fontWeight: 750, color: tokens.colorNeutralForeground1 }}>
                  {PREVIEW_AI_EVALUATION.candidateName} — {PREVIEW_AI_EVALUATION.targetRole}
                </Subtitle1>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  Overall Vector Similarity: <strong>{PREVIEW_AI_EVALUATION.overallScore}%</strong>
                </Caption1>
              </div>
              <Badge appearance="filled" color="brand">
                {PREVIEW_AI_EVALUATION.recommendation}
              </Badge>
            </div>

            <div className={styles.evaluationGrid}>
              {PREVIEW_AI_EVALUATION.breakdown.map((item) => (
                <div key={item.area} className={styles.evalCriterion}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 650, fontSize: '13px', color: tokens.colorNeutralForeground1 }}>
                      {item.area}
                    </span>
                    <Badge appearance="tint" color="success">
                      {item.level} ({item.score}%)
                    </Badge>
                  </div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    {item.details}
                  </Caption1>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: tokens.borderRadiusSmall, border: `1px solid ${tokens.colorNeutralStroke3}` }}>
              <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '4px' }}>
                Automated Rationale Summary:
              </Caption1>
              <Body2 style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                {PREVIEW_AI_EVALUATION.summaryRationale}
              </Body2>
            </div>
          </div>
        </section>

        {/* SECTION 6: HIRING PIPELINE & INTERVIEWS */}
        <section id="pipeline" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Hiring Funnel & Interview Coordination</h2>
              <span className={styles.sectionSubtitle}>
                End-to-end recruitment stage progression and calendar synchronization.
              </span>
            </div>
            <Badge appearance="outline" color="subtle">Pipeline Simulation</Badge>
          </div>

          <div className={styles.pipelineBar}>
            {PREVIEW_PIPELINE.map((stage) => (
              <div key={stage.stage} className={styles.pipelineColumn}>
                <Caption1 style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stage.stage}
                </Caption1>
                <span style={{ fontSize: '24px', fontWeight: 750, color: tokens.colorNeutralForeground1 }}>
                  {stage.count}
                </span>
                <Caption1 style={{ color: tokens.colorBrandForeground1, fontWeight: 600 }}>
                  {stage.percentage}% conversion
                </Caption1>
              </div>
            ))}
          </div>

          <div className={styles.cardGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '8px' }}>
            {PREVIEW_INTERVIEWS.map((interview) => (
              <div key={interview.id} className={styles.metricCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge appearance="tint" color="informative">{interview.stage}</Badge>
                  <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>{interview.time}</Caption1>
                </div>
                <div style={{ fontWeight: 650, fontSize: '14px', color: tokens.colorNeutralForeground1 }}>
                  {interview.candidateName}
                </div>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  {interview.type}
                </Caption1>
                <Caption1 style={{ color: tokens.colorNeutralForeground4, marginTop: '4px' }}>
                  Interviewer: {interview.interviewer}
                </Caption1>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: CAPABILITIES */}
        <section id="capabilities" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Platform Capabilities</h2>
              <span className={styles.sectionSubtitle}>
                Engineered for enterprise talent operations with deep security and vector search accuracy.
              </span>
            </div>
          </div>

          <div className={styles.capabilityGrid}>
            {PREVIEW_CAPABILITIES.map((cap) => (
              <div key={cap.title} className={styles.capabilityCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: tokens.borderRadiusSmall, backgroundColor: tokens.colorNeutralBackground3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colorBrandForeground1 }}>
                    <Sparkle24Regular style={{ fontSize: '18px' }} />
                  </div>
                  <Badge appearance="tint" color="brand">{cap.badge}</Badge>
                </div>
                <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                  {cap.title}
                </Subtitle2>
                <Body2 style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                  {cap.description}
                </Body2>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8: BOTTOM CTA */}
        <div className={styles.ctaBox}>
          <Title2 style={{ color: tokens.colorNeutralForeground1, fontWeight: 800 }}>
            Ready to Deploy VectorHire?
          </Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3, maxWidth: '540px' }}>
            Experience autonomous candidate evaluation, vector matching, and structured recruiting operations.
          </Body1>
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button appearance="primary" size="large" icon={<ArrowRight20Filled />} iconPosition="after">
                Sign In to Workspace
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button appearance="secondary" size="large">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <footer className={styles.footer}>
          VectorHire Platform © 2026 • Autonomous Recruiting Operations & Talent Intelligence
        </footer>
      </main>
    </div>
  );
}
