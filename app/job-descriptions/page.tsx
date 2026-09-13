'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Button,
  Input,
  Textarea,
  MessageBar,
  MessageBarBody,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  AddRegular,
  DeleteRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  SearchRegular,
  SparkleRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.2)'),
  },
  formActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: tokens.spacingVerticalL,
  },
  jdCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(39, 54, 78, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.4)'),
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.3)',
    },
  },
  jdHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  jdTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  jdRequirements: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'pre-wrap',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.4',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalS,
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
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
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/job-descriptions');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to load job descriptions.');
      setJobDescriptions(Array.isArray(body) ? body : []);
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
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      const res = await fetch(`/api/job-descriptions/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to delete job description.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job description.');
    }
  };

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobDescriptions;
    const term = search.toLowerCase();
    return jobDescriptions.filter(
      (j) => j.title.toLowerCase().includes(term) || j.requirements.toLowerCase().includes(term)
    );
  }, [jobDescriptions, search]);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Title2>Job Descriptions</Title2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              Manage open positions and match candidates against role requirements
            </Caption1>
          </div>
          {editingId === null && (
            <Button appearance="primary" icon={<AddRegular />} onClick={startNew}>
              Create Job Description
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
            <Title3>{editingId === 'new' ? 'Create New Job Description' : 'Edit Job Description'}</Title3>
            <Input
              placeholder="Job title (e.g. Senior Full Stack Engineer)"
              value={title}
              onChange={(_, data) => setTitle(data.value)}
            />
            <Textarea
              placeholder="Paste the job requirements, required skills, and qualifications..."
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
                {saving ? 'Saving...' : 'Save Job Description'}
              </Button>
              <Button appearance="secondary" icon={<DismissRegular />} onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ChartContainer
          title={`Available Positions (${filteredJobs.length})`}
          subtitle="Select a role to inspect requirements, run AI candidate matching, and review ranked talent"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, width: '100%' }}>
            <div className={styles.searchBar}>
              <Input
                placeholder="Search jobs by title or skill requirement..."
                contentBefore={<SearchRegular />}
                value={search}
                onChange={(_, data) => setSearch(data.value)}
                style={{ minWidth: '280px', flex: 1 }}
              />
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <Spinner label="Loading positions..." />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                {search ? 'No job descriptions match your search.' : 'No job descriptions yet. Create one to begin matching candidates.'}
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredJobs.map((jd) => (
                  <div key={jd.id} className={styles.jdCard}>
                    <div>
                      <div className={styles.jdHeader}>
                        <div className={styles.jdTitle}>{jd.title}</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
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

                      <div style={{ marginTop: '8px' }}>
                        <div className={styles.jdRequirements}>{jd.requirements}</div>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                        {jd.created_at ? new Date(jd.created_at).toLocaleDateString() : ''}
                      </Caption1>

                      <Link href={`/job-descriptions/${jd.id}`} style={{ textDecoration: 'none' }}>
                        <Button
                          appearance="primary"
                          size="small"
                          icon={<SparkleRegular />}
                          iconPosition="after"
                        >
                          View Job & Matches
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
