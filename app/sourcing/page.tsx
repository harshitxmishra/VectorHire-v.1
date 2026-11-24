'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Badge,
  Button,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Spinner,
  TabList,
  Tab,
  makeStyles,
  tokens,
  shorthands,
  Card,
  Avatar,
  Textarea,
  Dropdown,
  Option,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  PersonSearch20Regular,
  PlayRegular,
  SendRegular,
  DismissRegular,
  ArrowImportRegular,
  CheckmarkRegular,
  OpenRegular,
  SparkleRegular,
  CodeRegular,
  DocumentTextRegular,
  FilterRegular,
} from '@fluentui/react-icons';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { SourcedProspect, JobDescription, ProspectStatus } from '@/lib/types';
import { safeParseApiResponse } from '@/lib/utils/api-client';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  runPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke3),
  },
  prospectCard: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  prospectHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  prospectInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  emailDraftBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px 16px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke3),
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
});

export default function SourcingPage() {
  const styles = useStyles();
  const notify = useAppToast();

  const [prospects, setProspects] = useState<SourcedProspect[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | ProspectStatus>('ALL');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [draftTexts, setDraftTexts] = useState<Record<number, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Load Job Descriptions
  const loadJobDescriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/job-descriptions');
      if (res.ok) {
        const jds = await safeParseApiResponse<JobDescription[]>(res);
        if (Array.isArray(jds) && jds.length > 0) {
          setJobDescriptions(jds);
          setSelectedJdId(jds[0].id);
        }
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // Load Prospects
  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sourcing');
      if (res.ok) {
        const data = await safeParseApiResponse<SourcedProspect[]>(res);
        setProspects(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobDescriptions();
    loadProspects();
  }, [loadJobDescriptions, loadProspects]);

  // Launch Autonomous Sourcing Run
  const handleLaunchSourcing = async () => {
    if (!selectedJdId || running) return;
    setRunning(true);
    notify('Autonomous Sourcer launched. Interrogating GitHub repositories...', 'info');

    const selectedJd = jobDescriptions.find((j) => j.id === selectedJdId);

    try {
      const res = await fetch('/api/sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description_id: selectedJdId,
          role_title: selectedJd?.title || 'Senior Software Engineer',
          requirements: selectedJd?.requirements || 'TypeScript, Node.js, PostgreSQL',
          max_prospects: 3,
        }),
      });

      if (!res.ok) {
        throw new Error(`Sourcing run failed (${res.status})`);
      }

      await loadProspects();
      notify('Sourcing run completed! New prospects queued for human approval.', 'success');
    } catch (err: any) {
      notify(err?.message || 'Sourcing run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  // Human Approval Actions (Approve, Reject, Import)
  const handleAction = async (
    prospectId: number,
    action: 'APPROVE' | 'REJECT' | 'IMPORT'
  ) => {
    setActionLoadingId(prospectId);
    try {
      const customDraft = draftTexts[prospectId];
      const res = await fetch(`/api/sourcing/${prospectId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          custom_email_body: customDraft,
          reviewer: 'recruiter@vectorhire.ai',
        }),
      });

      if (!res.ok) throw new Error(`Action failed with status ${res.status}`);

      const result = await res.json();
      notify(
        action === 'APPROVE'
          ? 'Prospect approved and outreach email dispatched!'
          : action === 'IMPORT'
          ? 'Prospect imported into active candidate pipeline!'
          : 'Prospect rejected.',
        'success'
      );

      // Update local prospect state
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? result.prospect : p))
      );
      setEditingDraftId(null);
    } catch (err: any) {
      notify(err?.message || 'Failed to update prospect', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProspects = prospects.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.status === activeFilter;
  });

  const getStatusBadge = (status: ProspectStatus) => {
    switch (status) {
      case 'PENDING_HUMAN_APPROVAL':
        return (
          <Badge appearance="filled" color="warning">
            Pending Human Approval
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge appearance="filled" color="success">
            Approved & Sent
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge appearance="tint" color="danger">
            Rejected
          </Badge>
        );
      case 'IMPORTED':
        return (
          <Badge appearance="filled" color="brand">
            Imported to Pipeline
          </Badge>
        );
      default:
        return <Badge appearance="tint">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header Bar */}
        <div className={styles.header}>
          <div>
            <Title2>Autonomous Outbound Sourcing (HITL)</Title2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginTop: '2px' }}>
              Autonomous GitHub Repo Discovery, Pre-Screening & Human-in-the-Loop Outreach Approval
            </Caption1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge appearance="tint" color="informative">
              Strict HITL Policy: 0 Auto-Dispatches
            </Badge>
          </div>
        </div>

        {/* Launch Sourcing Run Control */}
        <div className={styles.runPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Target Job Description:</span>
            <Dropdown
              value={
                jobDescriptions.find((j) => j.id === selectedJdId)?.title ||
                'Select Job Description'
              }
              selectedOptions={selectedJdId ? [String(selectedJdId)] : []}
              onOptionSelect={(_, data) => setSelectedJdId(Number(data.optionValue))}
              style={{ minWidth: '280px' }}
            >
              {jobDescriptions.map((jd) => (
                <Option key={jd.id} value={String(jd.id)}>
                  {jd.title}
                </Option>
              ))}
            </Dropdown>
          </div>

          <Button
            appearance="primary"
            icon={running ? <Spinner size="extra-tiny" /> : <PlayRegular />}
            disabled={running || !selectedJdId}
            onClick={handleLaunchSourcing}
          >
            {running ? 'Sourcing from GitHub...' : 'Launch Sourcing Run'}
          </Button>
        </div>

        {/* Filter Tabs */}
        <TabList
          selectedValue={activeFilter}
          onTabSelect={(_, data) => setActiveFilter(data.value as typeof activeFilter)}
        >
          <Tab value="ALL">All Prospects ({prospects.length})</Tab>
          <Tab value="PENDING_HUMAN_APPROVAL">
            Pending Approval ({prospects.filter((p) => p.status === 'PENDING_HUMAN_APPROVAL').length})
          </Tab>
          <Tab value="APPROVED">
            Approved ({prospects.filter((p) => p.status === 'APPROVED').length})
          </Tab>
          <Tab value="IMPORTED">
            Imported ({prospects.filter((p) => p.status === 'IMPORTED').length})
          </Tab>
          <Tab value="REJECTED">
            Rejected ({prospects.filter((p) => p.status === 'REJECTED').length})
          </Tab>
        </TabList>

        {/* Prospects List */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Spinner label="Loading sourced prospects..." />
          </div>
        ) : filteredProspects.length === 0 ? (
          <div
            style={{
              padding: '64px',
              textAlign: 'center',
              backgroundColor: tokens.colorNeutralBackground1,
              borderRadius: tokens.borderRadiusLarge,
              border: `1px dashed ${tokens.colorNeutralStroke2}`,
            }}
          >
            <PersonSearch20Regular style={{ fontSize: '36px', color: tokens.colorNeutralForeground4 }} />
            <Title3 style={{ marginTop: '12px', display: 'block' }}>No Prospects in this Queue</Title3>
            <Body2 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
              Select a target Job Description above and launch an autonomous sourcing run to discover engineers.
            </Body2>
          </div>
        ) : (
          filteredProspects.map((prospect) => {
            const isPending = prospect.status === 'PENDING_HUMAN_APPROVAL';
            const draftValue =
              draftTexts[prospect.id] !== undefined
                ? draftTexts[prospect.id]
                : prospect.personalized_email_draft;
            const isEditing = editingDraftId === prospect.id;
            const isActing = actionLoadingId === prospect.id;

            return (
              <div key={prospect.id} className={styles.prospectCard}>
                {/* Header Row */}
                <div className={styles.prospectHeader}>
                  <div className={styles.prospectInfo}>
                    <Avatar
                      image={{ src: prospect.avatar_url || undefined }}
                      name={prospect.full_name || prospect.github_username}
                      size={48}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px' }}>
                          {prospect.full_name || prospect.github_username}
                        </span>
                        <a
                          href={prospect.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', color: tokens.colorBrandForeground1 }}
                        >
                          <Caption1>@{prospect.github_username} &nearr;</Caption1>
                        </a>
                      </div>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        Discovered {new Date(prospect.created_at).toLocaleDateString()} &bull; Cited:{' '}
                        {prospect.cited_repos?.join(', ') || 'Original Repos'}
                      </Caption1>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: tokens.colorPaletteGreenForeground1 }}>
                        {prospect.score} / 100
                      </div>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                        Pre-Screen Signal Score
                      </Caption1>
                    </div>

                    {getStatusBadge(prospect.status)}
                  </div>
                </div>

                {/* Personalized Outreach Draft Box */}
                <div className={styles.emailDraftBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: tokens.colorBrandForeground1 }}>
                      Personalized Outreach Email Draft (AI-Tailored from Code Architecture)
                    </span>
                    {isPending && (
                      <Button
                        size="small"
                        appearance="subtle"
                        onClick={() => {
                          setEditingDraftId(isEditing ? null : prospect.id);
                          if (!draftTexts[prospect.id]) {
                            setDraftTexts((prev) => ({
                              ...prev,
                              [prospect.id]: prospect.personalized_email_draft,
                            }));
                          }
                        }}
                      >
                        {isEditing ? 'Done Editing' : 'Edit Draft'}
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={draftValue}
                      onChange={(_, data) =>
                        setDraftTexts((prev) => ({
                          ...prev,
                          [prospect.id]: data.value,
                        }))
                      }
                      rows={8}
                      style={{ width: '100%', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <Body2
                      style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6',
                        color: tokens.colorNeutralForeground1,
                        fontSize: '13px',
                      }}
                    >
                      {draftValue}
                    </Body2>
                  )}
                </div>

                {/* HITL Action Bar */}
                <div className={styles.actionsRow}>
                  {isPending ? (
                    <>
                      <Button
                        appearance="subtle"
                        icon={<DismissRegular />}
                        disabled={isActing}
                        onClick={() => handleAction(prospect.id, 'REJECT')}
                      >
                        Reject
                      </Button>

                      <Button
                        appearance="secondary"
                        icon={<ArrowImportRegular />}
                        disabled={isActing}
                        onClick={() => handleAction(prospect.id, 'IMPORT')}
                      >
                        Import to Pipeline
                      </Button>

                      <Button
                        appearance="primary"
                        icon={isActing ? <Spinner size="extra-tiny" /> : <SendRegular />}
                        disabled={isActing}
                        onClick={() => handleAction(prospect.id, 'APPROVE')}
                      >
                        Approve & Send Outreach
                      </Button>
                    </>
                  ) : prospect.status === 'APPROVED' ? (
                    <Button
                      appearance="secondary"
                      icon={<ArrowImportRegular />}
                      disabled={isActing}
                      onClick={() => handleAction(prospect.id, 'IMPORT')}
                    >
                      Import to Candidate Pipeline
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
