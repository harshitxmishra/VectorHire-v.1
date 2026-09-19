'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  makeStyles,
  tokens,
  shorthands,
  Title1,
  Body2,
  Caption1,
  Input,
  Button,
  Field,
  TabList,
  Tab,
  MessageBar,
  MessageBarBody,
  Divider,
  Spinner,
} from '@fluentui/react-components';
import {
  LockClosed24Regular,
  Mail24Regular,
  Person24Regular,
  Sparkle24Regular,
  ArrowRight20Filled,
  Bot24Regular,
  Eye20Regular,
  EyeOff20Regular,
  Open20Regular,
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground3,
    backgroundImage: `
      radial-gradient(circle at 20% 15%, ${tokens.colorBrandBackground2}, transparent 40%),
      radial-gradient(circle at 80% 85%, ${tokens.colorBrandBackground2}, transparent 45%)
    `,
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow64,
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
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke2),
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    marginBottom: tokens.spacingVerticalXS,
  },
  brandTitle: {
    letterSpacing: '-0.03em',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
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
  },
  demoButton: {
    height: '42px',
  },
  previewLinkButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    paddingTop: tokens.spacingVerticalXS,
    ':hover': {
      textDecoration: 'underline',
    },
  },
  footerText: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: '12px',
  },
});

function getSafeRedirect(redirectParam: string | null): string {
  if (!redirectParam) return '/dashboard';
  if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam;
  }
  return '/dashboard';
}

function LoginFormContent() {
  const styles = useStyles();
  const { user, loading: authLoading, signInWithPassword, signUpWithPassword, signInWithDemo } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = getSafeRedirect(searchParams.get('redirect'));

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTarget);
    }
  }, [user, authLoading, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(cleanEmail, password);
        if (res.error) {
          setError(res.error);
        } else {
          router.replace(redirectTarget);
        }
      } else {
        const res = await signUpWithPassword(cleanEmail, password, name.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.requiresEmailConfirmation) {
          setInfoMessage('Account created! Please check your email inbox to confirm your account before signing in.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        } else {
          router.replace(redirectTarget);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await signInWithDemo();
      if (res.error) {
        setError(res.error);
      } else {
        router.replace(redirectTarget);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.brandHeader}>
        <div className={styles.brandPill}>
          <Sparkle24Regular style={{ fontSize: '14px' }} />
          <span>AI Talent Intelligence</span>
        </div>
        <Title1 className={styles.brandTitle}>VectorHire</Title1>
        <Body2 className={styles.brandSubtitle}>
          Autonomous resume matching, candidate scoring, and interview operations
        </Body2>
      </div>

      <TabList
        selectedValue={mode}
        onTabSelect={(_, data) => {
          setMode(data.value as 'signin' | 'signup');
          setError(null);
          setInfoMessage(null);
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

      {infoMessage ? (
        <MessageBar intent="success">
          <MessageBarBody>{infoMessage}</MessageBarBody>
        </MessageBar>
      ) : null}

      <form onSubmit={handleSubmit} className={styles.form}>
        {mode === 'signup' && (
          <Field label="Full Name" required>
            <Input
              contentBefore={<Person24Regular />}
              placeholder="e.g. Alex Mercer"
              value={name}
              onChange={(_, d) => setName(d.value)}
              required
              disabled={loading}
            />
          </Field>
        )}

        <Field label="Work Email" required>
          <Input
            type="email"
            contentBefore={<Mail24Regular />}
            placeholder="recruiter@company.com"
            value={email}
            onChange={(_, d) => setEmail(d.value)}
            required
            disabled={loading}
          />
        </Field>

        <Field label="Password" required>
          <Input
            type={showPassword ? 'text' : 'password'}
            contentBefore={<LockClosed24Regular />}
            contentAfter={
              <Button
                appearance="transparent"
                size="small"
                icon={showPassword ? <EyeOff20Regular /> : <Eye20Regular />}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              />
            }
            placeholder="••••••••••••"
            value={password}
            onChange={(_, d) => setPassword(d.value)}
            required
            disabled={loading}
          />
        </Field>

        {mode === 'signup' && (
          <Field label="Confirm Password" required>
            <Input
              type={showPassword ? 'text' : 'password'}
              contentBefore={<LockClosed24Regular />}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(_, d) => setConfirmPassword(d.value)}
              required
              disabled={loading}
            />
          </Field>
        )}

        <Button
          type="submit"
          appearance="primary"
          disabled={loading}
          className={styles.submitButton}
          icon={loading ? <Spinner size="tiny" /> : <ArrowRight20Filled />}
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
        disabled={loading}
        onClick={handleDemoAccess}
      >
        Continue with Demo Account (1-Click)
      </Button>

      <Link href="/preview" className={styles.previewLinkButton}>
        <span>Explore VectorHire without signing in</span>
        <Open20Regular style={{ fontSize: '13px' }} />
      </Link>

      <Caption1 className={styles.footerText}>
        Enterprise candidate pipelines protected with vector embeddings and end-to-end security.
      </Caption1>
    </div>
  );
}

export default function LoginPage() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Suspense fallback={<Spinner size="medium" label="Loading VectorHire authentication..." />}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
