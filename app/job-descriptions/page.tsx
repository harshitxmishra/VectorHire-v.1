'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  Button,
  Input,
  Textarea,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular, SaveRegular, DismissRegular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useCallback, useEffect, useState } from 'react';
import { JobDescription } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  formActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  jdItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  jdHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jdTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  jdRequirements: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'pre-wrap',
  },
});

export default function JobDescriptionsPage() {
  const styles = useStyles();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/job-descriptions');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to load job descriptions.');
      setJobDescriptions(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job descriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startNew = () => {
    setEditingId('new');
    setTitle('');
    setRequirements('');
  };

  const startEdit = (jd: JobDescription) => {
    setEditingId(jd.id);
    setTitle(jd.title);
    setRequirements(jd.requirements);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setRequirements('');
  };

  const save = async () => {
    if (!title.trim() || !requirements.trim()) return;
    setSaving(true);

    try {
      const isNew = editingId === 'new';
      const url = isNew ? '/api/job-descriptions' : `/api/job-descriptions/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, requirements }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to save job description.');

      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job description.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      const res = await fetch(`/api/job-descriptions/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to delete job description.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job description.');
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Job Descriptions</Title2>
          {editingId === null && (
            <Button appearance="primary" icon={<AddRegular />} onClick={startNew}>
              New Job Description
            </Button>
          )}
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        {editingId !== null && (
          <div className={styles.form}>
            <Input
              placeholder="Job title (e.g. Senior Full Stack Engineer)"
              value={title}
              onChange={(_, data) => setTitle(data.value)}
            />
            <Textarea
              placeholder="Paste the job requirements here..."
              value={requirements}
              onChange={(_, data) => setRequirements(data.value)}
              rows={8}
            />
            <div className={styles.formActions}>
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                disabled={saving || !title.trim() || !requirements.trim()}
                onClick={save}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button appearance="secondary" icon={<DismissRegular />} onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ChartContainer title="Saved Job Descriptions" subtitle="Select one to match candidates against on the Candidates page">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading job descriptions...</p>
            ) : jobDescriptions.length === 0 ? (
              <p>No job descriptions yet. Create one to start matching candidates.</p>
            ) : (
              jobDescriptions.map((jd) => (
                <div key={jd.id} className={styles.jdItem}>
                  <div className={styles.jdHeader}>
                    <div className={styles.jdTitle}>{jd.title}</div>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<EditRegular />}
                        onClick={() => startEdit(jd)}
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DeleteRegular />}
                        onClick={() => remove(jd.id)}
                      />
                    </div>
                  </div>
                  <div className={styles.jdRequirements}>{jd.requirements}</div>
                </div>
              ))
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
