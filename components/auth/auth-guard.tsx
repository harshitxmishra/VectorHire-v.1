'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { makeStyles, tokens, Spinner, Body1 } from '@fluentui/react-components';

const useStyles = makeStyles({
  loadingContainer: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },
  loadingText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    fontWeight: 500,
  },
});

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const styles = useStyles();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Validate pathname to prevent open redirect vulnerabilities
      const safeRedirect =
        pathname && pathname.startsWith('/') && !pathname.startsWith('//')
          ? encodeURIComponent(pathname)
          : 'dashboard';

      router.replace(`/login?redirect=${safeRedirect}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Authenticating VectorHire workspace..." />
        <Body1 className={styles.loadingText}>Verifying session</Body1>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
