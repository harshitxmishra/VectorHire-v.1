'use client';

import { makeStyles, tokens } from '@fluentui/react-components';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { ReactNode } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: 'transparent',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalXL,
    background:
      'linear-gradient(180deg, rgba(8, 15, 30, 0.72) 0%, rgba(2, 6, 23, 0.64) 100%)',
  },
  contentInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    maxWidth: '1440px',
    marginLeft: 'auto',
    marginRight: 'auto',
    minHeight: '100%',
  },
});

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <main className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
