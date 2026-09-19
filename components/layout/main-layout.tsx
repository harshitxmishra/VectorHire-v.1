'use client';

import { makeStyles, tokens, Toaster } from '@fluentui/react-components';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { ReactNode } from 'react';
import { APP_TOASTER_ID } from '@/lib/hooks/use-app-toast';
import { AuthGuard } from '@/components/auth/auth-guard';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: '20px',
    paddingBottom: '40px',
    paddingLeft: '24px',
    paddingRight: '24px',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  contentInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '1440px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const styles = useStyles();

  return (
    <AuthGuard>
      <div className={styles.root}>
        <Toaster toasterId={APP_TOASTER_ID} />
        <Sidebar />
        <div className={styles.main}>
          <Navbar />
          <main className={styles.content}>
            <div className={styles.contentInner}>{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
