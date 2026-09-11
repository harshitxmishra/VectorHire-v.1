'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  Title3,
  Input,
  Button,
  Field,
  Dropdown,
  Option,
  Textarea,
  Switch,
  Slider,
  TabList,
  Tab,
  Badge,
  makeStyles,
  tokens,
  shorthands,
  Caption1,
  Body2,
} from '@fluentui/react-components';
import {
  SaveRegular,
  Sparkle24Regular,
  Mail24Regular,
  Person24Regular,
  Link24Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useAuth } from '@/lib/context/auth-context';
import { useAppToast } from '@/lib/hooks/use-app-toast';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
  integrationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
  },
});

export default function SettingsPage() {
  const styles = useStyles();
  const { user, workspaceName, updateWorkspace, updateUser } = useAuth();
  const notify = useAppToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'email' | 'integrations'>('profile');

  // Profile Settings
  const [name, setName] = useState(user?.name || 'Recruiting Admin');
  const [role, setRole] = useState(user?.role || 'Head of Talent');
  const [workspace, setWorkspace] = useState(workspaceName || 'Enterprise Recruiting');

  // AI Settings
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);

  // Email Templates
  const [assessmentSubject, setAssessmentSubject] = useState('Technical Assessment Invitation — VectorHire');
  const [assessmentBody, setAssessmentBody] = useState(
    'Hi {{candidate_name}},\n\nWe were impressed by your profile for the {{role}} position! Please complete our technical assessment by {{deadline}} using the link below:\n\n{{assessment_link}}\n\nBest regards,\n{{recruiter_name}}'
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
    }
    if (workspaceName) {
      setWorkspace(workspaceName);
    }
  }, [user, workspaceName]);

  const handleSaveProfile = () => {
    updateUser({ name, role });
    updateWorkspace(workspace);
    notify('Profile and workspace settings saved!', 'success');
  };

  const handleSaveAI = () => {
    notify('AI model configurations updated!', 'success');
  };

  const handleSaveEmail = () => {
    notify('Email templates saved successfully!', 'success');
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Workspace Settings & Integrations</Title2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Manage identity, AI models, email dispatches, and system integrations
          </Caption1>
        </div>

        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as any)}
        >
          <Tab value="profile" icon={<Person24Regular />}>
            Workspace & Identity
          </Tab>
          <Tab value="ai" icon={<Sparkle24Regular />}>
            AI Model Engine
          </Tab>
          <Tab value="email" icon={<Mail24Regular />}>
            Email Templates
          </Tab>
          <Tab value="integrations" icon={<Link24Regular />}>
            Integrations & Cloud
          </Tab>
        </TabList>

        {activeTab === 'profile' && (
          <div className={styles.card}>
            <Title3>Recruiter Profile & Node Identity</Title3>
            <div className={styles.formGrid}>
              <Field label="Recruiter Display Name">
                <Input value={name} onChange={(_, d) => setName(d.value)} />
              </Field>
              <Field label="Recruiting Role / Title">
                <Input value={role} onChange={(_, d) => setRole(d.value)} />
              </Field>
              <Field label="Workspace Name">
                <Input value={workspace} onChange={(_, d) => setWorkspace(d.value)} />
              </Field>
              <Field label="Account Email">
                <Input value={user?.email || 'admin@vectorhire.ai'} disabled />
              </Field>
            </div>
            <Button
              appearance="primary"
              icon={<SaveRegular />}
              onClick={handleSaveProfile}
              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
            >
              Save Profile Changes
            </Button>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className={styles.card}>
            <Title3>AI Intelligence Engine Settings</Title3>
            <div className={styles.formGrid}>
              <Field label="Primary AI Provider">
                <Dropdown
                  value={aiProvider.toUpperCase()}
                  onOptionSelect={(_, d) => setAiProvider(d.optionValue || 'gemini')}
                >
                  <Option value="gemini">Google Gemini (Recommended)</Option>
                  <Option value="groq">Groq (Ultra-fast LLaMA)</Option>
                  <Option value="openai">OpenAI (GPT-4o)</Option>
                  <Option value="openrouter">OpenRouter</Option>
                </Dropdown>
              </Field>
              <Field label="Model Identifier">
                <Input value={aiModel} onChange={(_, d) => setAiModel(d.value)} />
              </Field>
            </div>

            <Field label={`Model Temperature / Creativity: ${temperature}`}>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(_, d) => setTemperature(d.value)}
              />
            </Field>

            <Button
              appearance="primary"
              icon={<SaveRegular />}
              onClick={handleSaveAI}
              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
            >
              Update AI Engine
            </Button>
          </div>
        )}

        {activeTab === 'email' && (
          <div className={styles.card}>
            <Title3>Email Automation Templates</Title3>
            <Field label="Assessment Subject Line">
              <Input
                value={assessmentSubject}
                onChange={(_, d) => setAssessmentSubject(d.value)}
              />
            </Field>

            <Field label="Assessment Email Body (supports {{candidate_name}}, {{role}}, {{deadline}}, {{assessment_link}})">
              <Textarea
                value={assessmentBody}
                onChange={(_, d) => setAssessmentBody(d.value)}
                rows={7}
              />
            </Field>

            <Button
              appearance="primary"
              icon={<SaveRegular />}
              onClick={handleSaveEmail}
              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
            >
              Save Email Templates
            </Button>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className={styles.card}>
            <Title3>Connected Integrations & Cloud Services</Title3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.integrationRow}>
                <div>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    Supabase Vector DB
                  </div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    PostgreSQL backend storing candidates, embeddings, and evaluations
                  </Caption1>
                </div>
                <Badge appearance="tint" color="success" icon={<CheckmarkCircle20Filled />}>
                  Connected
                </Badge>
              </div>

              <div className={styles.integrationRow}>
                <div>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    Google Calendar & Google Meet
                  </div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Automatic interview link generation and recruiter schedule sync
                  </Caption1>
                </div>
                <Badge appearance="tint" color="informative">
                  Active
                </Badge>
              </div>

              <div className={styles.integrationRow}>
                <div>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    GitHub Intelligence API
                  </div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Automatic repository evaluation, code analysis, and language extraction
                  </Caption1>
                </div>
                <Badge appearance="tint" color="success" icon={<CheckmarkCircle20Filled />}>
                  Connected
                </Badge>
              </div>

              <div className={styles.integrationRow}>
                <div>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    Nodemailer SMTP Dispatch
                  </div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Live outbound candidate communication
                  </Caption1>
                </div>
                <Badge appearance="tint" color="success" icon={<CheckmarkCircle20Filled />}>
                  Ready
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
