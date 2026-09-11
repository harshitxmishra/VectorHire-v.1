'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  Button,
  Input,
  Field,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  ProgressBar,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { AddRegular, TargetArrow24Regular, Calendar20Regular, People20Regular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useAppData } from '@/lib/hooks/use-app-data';
import { useState } from 'react';
import { useAppToast } from '@/lib/hooks/use-app-toast';

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
    marginBottom: tokens.spacingVerticalM,
  },
  campaignGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: tokens.spacingVerticalL,
  },
  campaignCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      ...shorthands.borderColor('rgba(129, 140, 248, 0.35)'),
      transform: 'translateY(-2px)',
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  campaignTitle: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  metaText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  progressBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase100,
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
});

interface Campaign {
  id: string;
  name: string;
  college: string;
  targetHires: number;
  currentHires: number;
  deadline: string;
  status: 'Active' | 'Upcoming' | 'Completed';
}

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Fall 2026 AI Campus Drive',
    college: 'Delhi Technological University',
    targetHires: 10,
    currentHires: 6,
    deadline: '2026-10-31',
    status: 'Active',
  },
  {
    id: '2',
    name: 'NSUT Core Engineering Sourcing',
    college: 'Netaji Subhas University of Technology',
    targetHires: 8,
    currentHires: 4,
    deadline: '2026-11-15',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Off-Campus Fullstack Cohort',
    college: 'All Institutions',
    targetHires: 15,
    currentHires: 11,
    deadline: '2026-12-01',
    status: 'Active',
  },
];

export default function HiringCampaignsPage() {
  const styles = useStyles();
  const { candidates } = useAppData();
  const notify = useAppToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>(DEFAULT_CAMPAIGNS);
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCollege, setNewCollege] = useState('');
  const [newTarget, setNewTarget] = useState('5');
  const [newDeadline, setNewDeadline] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) {
      notify('Campaign title is required', 'error');
      return;
    }

    const created: Campaign = {
      id: Date.now().toString(),
      name: newTitle,
      college: newCollege || 'General Pool',
      targetHires: parseInt(newTarget, 10) || 5,
      currentHires: 0,
      deadline: newDeadline || '2026-12-31',
      status: 'Active',
    };

    setCampaigns((prev) => [created, ...prev]);
    notify(`Campaign "${created.name}" created successfully!`, 'success');
    setOpenModal(false);
    setNewTitle('');
    setNewCollege('');
    setNewTarget('5');
    setNewDeadline('');
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Title2>Hiring Campaigns & Drives</Title2>
          </div>

          <Dialog open={openModal} onOpenChange={(_, data) => setOpenModal(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<AddRegular />}>
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Launch New Hiring Campaign</DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Field label="Campaign Name" required>
                    <Input
                      placeholder="e.g. 2026 Campus Drive"
                      value={newTitle}
                      onChange={(_, d) => setNewTitle(d.value)}
                    />
                  </Field>
                  <Field label="Target Institution / Candidate Pool">
                    <Input
                      placeholder="e.g. DTU / NSUT or All"
                      value={newCollege}
                      onChange={(_, d) => setNewCollege(d.value)}
                    />
                  </Field>
                  <Field label="Target Hires Count">
                    <Input
                      type="number"
                      value={newTarget}
                      onChange={(_, d) => setNewTarget(d.value)}
                    />
                  </Field>
                  <Field label="Target Completion Date">
                    <Input
                      type="date"
                      value={newDeadline}
                      onChange={(_, d) => setNewDeadline(d.value)}
                    />
                  </Field>
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setOpenModal(false)}>
                    Cancel
                  </Button>
                  <Button appearance="primary" onClick={handleCreate}>
                    Create Campaign
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>

        <div className={styles.campaignGrid}>
          {campaigns.map((camp) => {
            const progress = Math.min(100, Math.round((camp.currentHires / camp.targetHires) * 100));

            return (
              <div key={camp.id} className={styles.campaignCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.campaignTitle}>{camp.name}</div>
                    <span className={styles.metaText}>
                      <People20Regular /> {camp.college}
                    </span>
                  </div>
                  <Badge appearance="tint" color={camp.status === 'Active' ? 'success' : 'informative'}>
                    {camp.status}
                  </Badge>
                </div>

                <div className={styles.progressBlock}>
                  <div className={styles.progressLabels}>
                    <span>Hiring Quota: {camp.currentHires} of {camp.targetHires}</span>
                    <span>{progress}% Filled</span>
                  </div>
                  <ProgressBar value={progress / 100} color="brand" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '8px' }}>
                  <span className={styles.metaText}>
                    <Calendar20Regular /> Target: {new Date(camp.deadline).toLocaleDateString()}
                  </span>
                  <Badge appearance="tint">
                    {candidates.filter((c) => camp.college === 'All Institutions' || c.college === camp.college).length} in pool
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
