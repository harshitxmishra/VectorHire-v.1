'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2 } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import { ChartContainer } from '@/components/ui/chart-container';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  settingContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

export default function SettingsPage() {
  const styles = useStyles();

  const settings = [
    { label: 'Email Notifications', value: 'Enabled' },
    { label: 'Dark Mode', value: 'Enabled' },
    { label: 'Two-Factor Authentication', value: 'Disabled' },
    { label: 'API Access', value: 'Active' },
    { label: 'Data Export', value: 'Available' },
    { label: 'Team Members', value: '3 members' },
  ];

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Settings & Preferences</Title2>
        </div>

        <ChartContainer title="Account Settings" subtitle="Workspace preferences and configuration">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            {settings.map((setting) => (
              <div key={setting.label} className={styles.settingItem}>
                <div className={styles.settingContent}>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    {setting.label}
                  </div>
                </div>
                <div style={{ fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground2 }}>
                  {setting.value}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
