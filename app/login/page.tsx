'use client';

import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title1,
  Title3,
  Body1,
  Body2,
  Caption1,
  Input,
  Button,
  Field,
  TabList,
  Tab,
  MessageBar,
  MessageBarBody,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  LockClosed24Regular,
  Mail24Regular,
  Person24Regular,
  Sparkle24Regular,
  ArrowRight20Filled,
  Bot24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalL,
    backgroundColor: '#030712',
    backgroundImage: `
      radial-gradient(circle at 20% 15%, rgba(99, 102, 241, 0.18), transparent 40%),
      radial-gradient(circle at 80% 85%, rgba(59, 130, 246, 0.14), transparent 45%),
      linear-gradient(180deg, #030712 0%, #0B1120 100%)
    `,
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(24px)',
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.16)'),
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  brandHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalS,
  },
  brandPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    ...shorthands.border('1px', 'solid', 'rgba(129, 140, 248, 0.25)'),
    color: '#a5b4fc',
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    marginBottom: tokens.spacingVerticalXS,
  },
  brandTitle: {
    background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.03em',
    fontWeight: 800,
  },
  brandSubtitle: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '320px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  submitButton: {
    marginTop: tokens.spacingVerticalS,
    height: '42px',
    fontWeight: 600,
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    ...shorthands.border('none'),
    ':hover': {
      backgroundColor: '#4338ca',
    },
  },
  demoButton: {
    height: '42px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.2)'),
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: 'rgba(51, 65, 85, 0.8)',
      ...shorthands.borderColor('rgba(148, 163, 184, 0.4)'),
    },
  },
  footerText: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export default function LoginPage() {
  const styles = useStyles();
  const { signInWithPassword, signUpWithPassword, signInWithDemo } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setError(res.error);
        }
      } else {
        if (!name.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        const res = await signUpWithPassword(email, password, name);
        if (res.error) {
          setError(res.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    signInWithDemo('Head of Talent', 'Alex Mercer');
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <div className={styles.brandPill}>
            <Sparkle24Regular style={{ fontSize: '14px' }} />
            <span>AI Talent Intelligence</span>
          </div>
          <Title1 className={styles.brandTitle}>VectorHire</Title1>
          <Body2 className={styles.brandSubtitle}>
            Autonomous resume matching, candidate scoring, and interview scheduling
          </Body2>
        </div>

        <TabList
          selectedValue={mode}
          onTabSelect={(_, data) => {
            setMode(data.value as 'signin' | 'signup');
            setError(null);
          }}
          style={{ justifyContent: 'center' }}
        >
          <Tab value="signin">Sign In</Tab>
          <Tab value="signup">Create Account</Tab>
        </TabList>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <Field label="Full Name">
              <Input
                contentBefore={<Person24Regular />}
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(_, d) => setName(d.value)}
                required
              />
            </Field>
          )}

          <Field label="Work Email">
            <Input
              type="email"
              contentBefore={<Mail24Regular />}
              placeholder="recruiter@company.com"
              value={email}
              onChange={(_, d) => setEmail(d.value)}
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              contentBefore={<LockClosed24Regular />}
              placeholder="••••••••••••"
              value={password}
              onChange={(_, d) => setPassword(d.value)}
              required
            />
          </Field>

          <Button
            type="submit"
            appearance="primary"
            disabled={loading}
            className={styles.submitButton}
            icon={<ArrowRight20Filled />}
            iconPosition="after"
          >
            {loading
              ? 'Authenticating...'
              : mode === 'signin'
              ? 'Sign In to Workspace'
              : 'Create Account'}
          </Button>
        </form>

        <Divider>or</Divider>

        <Button
          appearance="secondary"
          className={styles.demoButton}
          icon={<Bot24Regular />}
          onClick={handleDemoAccess}
        >
          Explore as Demo Recruiter (1-Click)
        </Button>

        <Caption1 className={styles.footerText}>
          Enterprise candidate pipelines protected with vector embeddings and end-to-end security.
        </Caption1>
      </div>
    </div>
  );
}
