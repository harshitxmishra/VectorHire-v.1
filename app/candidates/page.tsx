'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Option,
  Title2,
  makeStyles,
  tokens,
  shorthands,
  Input,
  TabList,
  Tab,
  Slider,
  Field,
  Body2,
  Caption1,
} from '@fluentui/react-components';
import {
  Sparkle16Regular,
  DatabaseRegular,
  ArrowSyncRegular,
  ArrowTrendingRegular,
  MailRegular,
  SearchRegular,
  TableSimple24Regular,
  Board24Regular,
  Filter20Regular,
  Code16Regular,
} from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { DatasetManagerDialog } from '@/components/candidates/DatasetManagerDialog';
import { ShortlistDialog } from '@/components/candidates/ShortlistDialog';
import { CandidateKanban } from '@/components/candidates/CandidateKanban';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Candidate,
  AIEvaluationResult,
  JobDescription,
  JobMatchResult,
  GitHubIntelligence,
  PIPELINE_STAGES,
} from '@/lib/types';

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
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.14)'),
  },
  filterInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    flex: 1,
  },
  candidateItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(39, 54, 78, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.35)'),
    },
  },
  candidateContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: '220px',
  },
  candidateName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  candidateDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  scoreMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: '70px',
  },
  score: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase400,
  },
  scoreLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  jdSelector: {
    minWidth: '240px',
  },
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';
type MatchStatus = 'not_matched' | 'matching' | 'matched' | 'error';

export default function CandidatesPage() {
  const styles = useStyles();

  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetManagerOpen, setDatasetManagerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);

  const [evaluations, setEvaluations] = useState<Record<number, AIEvaluationResult>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<Record<number, EvaluationStatus>>({});
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, JobMatchResult>>({});
  const [matchStatus, setMatchStatus] = useState<Record<number, MatchStatus>>({});
  const [resumeParsing, setResumeParsing] = useState<Record<number, boolean>>({});
  const [githubIntel, setGithubIntel] = useState<Record<number, GitHubIntelligence>>({});
  const [githubLoading, setGithubLoading] = useState<Record<number, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const notify = useAppToast();

  const loadCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      const data: Candidate[] = await res.json();
      setTopCandidates(Array.isArray(data) ? data : []);

      const seededEvaluations: Record<number, AIEvaluationResult> = {};
      const seededStatus: Record<number, EvaluationStatus> = {};
      if (Array.isArray(data)) {
        data.forEach((candidate) => {
          if (candidate.ai_evaluation) {
            seededEvaluations[candidate.id] = candidate.ai_evaluation;
            seededStatus[candidate.id] = 'evaluated';
          }
        });
      }
      setEvaluations((prev) => ({ ...seededEvaluations, ...prev }));
      setEvaluationStatus((prev) => ({ ...seededStatus, ...prev }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobDescriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/job-descriptions');
      const body = await res.json();
      setJobDescriptions(Array.isArray(body) ? body : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
    loadJobDescriptions();
  }, [loadCandidates, loadJobDescriptions]);

  useEffect(() => {
    if (!selectedJobId) {
      setMatches({});
      setMatchStatus({});
      return;
    }

    fetch(`/api/v1/matching?jobDescriptionId=${selectedJobId}`)
      .then((res) => res.json())
      .then((body) => {
        const results: JobMatchResult[] = Array.isArray(body) ? body : [];
        const seeded: Record<number, JobMatchResult> = {};
        const seededStatus: Record<number, MatchStatus> = {};
        results.forEach((r) => {
          seeded[r.candidate_id] = r;
          seededStatus[r.candidate_id] = 'matched';
        });
        setMatches(seeded);
        setMatchStatus(seededStatus);
      })
      .catch((err) => console.error(err));
  }, [selectedJobId]);

  const runEvaluation = useCallback(async (candidate: Candidate, force = false) => {
    setEvaluationStatus((prev) => ({ ...prev, [candidate.id]: 'evaluating' }));
    setEvaluationError(null);

    try {
      const response = await fetch('/api/v1/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          full_name: candidate.full_name,
          college: candidate.college,
          cgpa: candidate.cgpa,
          github: candidate.github ?? '',
          status: candidate.status,
          ai_score: candidate.ai_score,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'AI evaluation failed.');
      }

      setEvaluations((prev) => ({ ...prev, [candidate.id]: result }));
      setEvaluationStatus((prev) => ({ ...prev, [candidate.id]: 'evaluated' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI evaluation failed.';
      setEvaluationError(message);
      setEvaluationStatus((prev) => ({ ...prev, [candidate.id]: 'error' }));
    }
  }, []);

  const runMatch = useCallback(
    async (candidate: Candidate) => {
      if (!selectedJobId) return;
      setMatchStatus((prev) => ({ ...prev, [candidate.id]: 'matching' }));

      try {
        const response = await fetch('/api/v1/matching/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_id: candidate.id, job_description_id: selectedJobId }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Match failed.');

        setMatches((prev) => ({
          ...prev,
          [candidate.id]: {
            id: 0,
            created_at: new Date().toISOString(),
            candidate_id: candidate.id,
            job_description_id: selectedJobId,
            match_percentage: result.matchPercentage,
            matched_skills: result.matchedSkills,
            missing_skills: result.missingSkills,
            experience_match: result.experienceMatch,
            education_match: result.educationMatch,
            recommendation: result.recommendation,
            evaluated_at: new Date().toISOString(),
          },
        }));
        setMatchStatus((prev) => ({ ...prev, [candidate.id]: 'matched' }));
      } catch (err) {
        console.error(err);
        setMatchStatus((prev) => ({ ...prev, [candidate.id]: 'error' }));
      }
    },
    [selectedJobId]
  );

  const runGithubAnalysis = useCallback(
    async (candidate: Candidate) => {
      if (!candidate.github) return;
      setGithubLoading((prev) => ({ ...prev, [candidate.id]: true }));

      try {
        const response = await fetch('/api/v1/ai/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_id: candidate.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'GitHub analysis failed.');
        setGithubIntel((prev) => ({ ...prev, [candidate.id]: result }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'GitHub analysis failed.';
        notify(message, 'error');
        if (message === 'Candidate not found.') {
          await loadCandidates();
        }
      } finally {
        setGithubLoading((prev) => ({ ...prev, [candidate.id]: false }));
      }
    },
    [notify, loadCandidates]
  );

  const handleRetryResume = async (candidate: Candidate) => {
    setResumeParsing((prev) => ({ ...prev, [candidate.id]: true }));

    try {
      const res = await fetch(`/api/v1/candidates/${candidate.id}/parse-resume`, { method: 'POST' });
      await res.json();
      await loadCandidates();
    } catch (err) {
      console.error(err);
    } finally {
      setResumeParsing((prev) => ({ ...prev, [candidate.id]: false }));
    }
  };

  const handleViewAnalysis = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDrawerOpen(true);

    if (!evaluations[candidate.id]) {
      runEvaluation(candidate);
    }

    if (selectedJobId && !matches[candidate.id]) {
      runMatch(candidate);
    }

    if (candidate.github && !githubIntel[candidate.id]) {
      runGithubAnalysis(candidate);
    }
  };

  const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update status.');
      setTopCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus } : c))
      );
      notify(`${candidate.full_name} moved to ${newStatus}`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkEmail = async (type: 'assessment' | 'offer') => {
    if (selectedIds.size === 0) {
      notify('Select at least one candidate first.', 'error');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/v1/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: Array.from(selectedIds), type }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to send emails.');
      notify(`Sent ${body.sent}, failed ${body.failed}.`, body.failed > 0 ? 'error' : 'success');
      await loadCandidates();
      setSelectedIds(new Set());
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to send emails.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConfirmShortlist = async (candidateIds: number[]) => {
    await Promise.all(
      candidateIds.map((id) =>
        fetch(`/api/candidates/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Shortlisted' }),
        })
      )
    );
    notify(`Shortlisted ${candidateIds.length} candidates.`, 'success');
    setShortlistOpen(false);
    await loadCandidates();
  };

  const uniqueColleges = useMemo(() => {
    const set = new Set<string>();
    topCandidates.forEach((c) => {
      if (c.college) set.add(c.college);
    });
    return Array.from(set);
  }, [topCandidates]);

  const filteredCandidates = useMemo(() => {
    return topCandidates.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.college?.toLowerCase().includes(q) ||
          c.branch?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (selectedCollege !== 'all' && c.college !== selectedCollege) {
        return false;
      }

      if (minScore > 0 && (c.ai_score || 0) < minScore) {
        return false;
      }

      return true;
    });
  }, [topCandidates, searchQuery, selectedCollege, minScore]);

  const selectedJob = jobDescriptions.find((jd) => jd.id === selectedJobId) ?? null;

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Title2>Candidate Intelligence Hub</Title2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              {filteredCandidates.length} of {topCandidates.length} candidates loaded
            </Caption1>
          </div>

          <div className={styles.headerActions}>
            <TabList
              selectedValue={viewMode}
              onTabSelect={(_, data) => setViewMode(data.value as 'table' | 'kanban')}
            >
              <Tab value="table" icon={<TableSimple24Regular />}>
                Table View
              </Tab>
              <Tab value="kanban" icon={<Board24Regular />}>
                Pipeline Board
              </Tab>
            </TabList>

            <Button
              appearance="secondary"
              icon={<ArrowTrendingRegular />}
              onClick={() => setShortlistOpen(true)}
            >
              Shortlist
            </Button>
            <Button
              appearance="secondary"
              icon={<MailRegular />}
              disabled={sendingEmail || selectedIds.size === 0}
              onClick={() => handleBulkEmail('assessment')}
            >
              Send Assessment ({selectedIds.size})
            </Button>
            <Button
              appearance="primary"
              icon={<DatabaseRegular />}
              onClick={() => setDatasetManagerOpen(true)}
            >
              Manage Dataset
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={styles.filterBar}>
          <div className={styles.filterInputs}>
            <Input
              contentBefore={<SearchRegular />}
              placeholder="Search by name, email, or skill..."
              value={searchQuery}
              onChange={(_, d) => setSearchQuery(d.value)}
              style={{ minWidth: '240px' }}
            />

            <Dropdown
              placeholder="Filter by College..."
              value={selectedCollege === 'all' ? 'All Colleges' : selectedCollege}
              onOptionSelect={(_, data) => setSelectedCollege(data.optionValue || 'all')}
              style={{ minWidth: '200px' }}
            >
              <Option value="all">All Colleges</Option>
              {uniqueColleges.map((col) => (
                <Option key={col} value={col}>
                  {col}
                </Option>
              ))}
            </Dropdown>

            <Dropdown
              className={styles.jdSelector}
              placeholder="Match against Job Description..."
              value={selectedJob?.title ?? 'No JD selected'}
              onOptionSelect={(_, data) =>
                setSelectedJobId(data.optionValue ? Number(data.optionValue) : null)
              }
            >
              <Option value="">No job description</Option>
              {jobDescriptions.map((jd) => (
                <Option key={jd.id} value={String(jd.id)}>
                  {jd.title}
                </Option>
              ))}
            </Dropdown>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' }}>
                Min Score: {minScore}%
              </Caption1>
              <Slider
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(_, d) => setMinScore(d.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <CandidateKanban
            candidates={filteredCandidates}
            matches={matches}
            onStatusChange={handleStatusChange}
            onViewAnalysis={handleViewAnalysis}
          />
        ) : (
          <ChartContainer
            title="Candidate Directory"
            subtitle="Ranked by AI matching and vector intelligence"
          >
            {loading ? (
              <p>Loading candidate directory...</p>
            ) : filteredCandidates.length === 0 ? (
              <div style={{ padding: tokens.spacingVerticalXXL, textAlign: 'center' }}>
                <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                  No candidates match the selected filters.
                </Body2>
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.spacingVerticalM,
                }}
              >
                {filteredCandidates.map((candidate) => (
                  <div key={candidate.id} className={styles.candidateItem}>
                    <Checkbox
                      checked={selectedIds.has(candidate.id)}
                      onChange={() => toggleSelected(candidate.id)}
                    />
                    <div className={styles.candidateContent}>
                      <div className={styles.candidateName}>{candidate.full_name}</div>
                      <div className={styles.candidateDesc}>
                        {candidate.college} • {candidate.email}
                        {candidate.cgpa ? ` • CGPA ${candidate.cgpa}` : ''}
                      </div>
                      {candidate.resume_url ? (
                        <div className={styles.candidateDesc}>
                          Resume:{' '}
                          {candidate.parsing_status === 'success'
                            ? 'Parsed'
                            : candidate.parsing_status === 'failed'
                            ? 'Parsing failed'
                            : 'Pending'}
                          {candidate.parsing_status === 'failed' ? (
                            <Button
                              appearance="transparent"
                              size="small"
                              icon={<ArrowSyncRegular />}
                              disabled={resumeParsing[candidate.id]}
                              onClick={() => handleRetryResume(candidate)}
                            >
                              Retry
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.scoreContainer}>
                      <div className={styles.scoreMeta}>
                        <div
                          className={styles.score}
                          style={{
                            color:
                              candidate.ai_score >= 85
                                ? '#22c55e'
                                : candidate.ai_score >= 70
                                ? '#eab308'
                                : '#ef4444',
                          }}
                        >
                          {candidate.ai_score}%
                        </div>
                        <div className={styles.scoreLabel}>Match Score</div>
                      </div>

                      {selectedJobId ? (
                        <Badge
                          appearance="tint"
                          color={
                            matchStatus[candidate.id] === 'matched'
                              ? 'success'
                              : matchStatus[candidate.id] === 'matching'
                              ? 'informative'
                              : matchStatus[candidate.id] === 'error'
                              ? 'danger'
                              : 'subtle'
                          }
                        >
                          {matchStatus[candidate.id] === 'matched'
                            ? `JD Match ${matches[candidate.id]?.match_percentage}%`
                            : matchStatus[candidate.id] === 'matching'
                            ? 'Matching...'
                            : matchStatus[candidate.id] === 'error'
                            ? 'Match Failed'
                            : 'Not Matched'}
                        </Badge>
                      ) : null}

                      <Badge
                        appearance="tint"
                        color={
                          evaluationStatus[candidate.id] === 'evaluated'
                            ? 'success'
                            : evaluationStatus[candidate.id] === 'evaluating'
                            ? 'informative'
                            : evaluationStatus[candidate.id] === 'error'
                            ? 'danger'
                            : 'subtle'
                        }
                      >
                        {evaluationStatus[candidate.id] === 'evaluated'
                          ? 'AI Ready'
                          : evaluationStatus[candidate.id] === 'evaluating'
                          ? 'Evaluating...'
                          : evaluationStatus[candidate.id] === 'error'
                          ? 'Failed'
                          : 'Pending'}
                      </Badge>

                      {candidate.github ? (
                        <Badge appearance="tint" color="brand" icon={<Code16Regular />}>
                          {candidate.github_score ? `${candidate.github_score}/100` : 'GitHub'}
                        </Badge>
                      ) : null}

                      <Dropdown
                        style={{ minWidth: '160px' }}
                        value={candidate.status}
                        onOptionSelect={(_, data) =>
                          data.optionValue && handleStatusChange(candidate, data.optionValue)
                        }
                      >
                        {PIPELINE_STAGES.map((stage) => (
                          <Option key={stage} value={stage}>
                            {stage}
                          </Option>
                        ))}
                      </Dropdown>

                      <Button
                        appearance="secondary"
                        size="small"
                        icon={<Sparkle16Regular />}
                        onClick={() => handleViewAnalysis(candidate)}
                      >
                        Insights
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartContainer>
        )}
      </div>

      <CandidateInsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={!!activeCandidate && evaluationStatus[activeCandidate.id] === 'evaluating'}
        candidateId={activeCandidate?.id}
        candidateName={activeCandidate?.full_name ?? ''}
        errorMessage={
          activeCandidate && evaluationStatus[activeCandidate.id] === 'error'
            ? evaluationError
            : null
        }
        onRetry={activeCandidate ? () => runEvaluation(activeCandidate, true) : undefined}
        data={activeCandidate ? evaluations[activeCandidate.id] : undefined}
        jobMatchLoading={!!activeCandidate && matchStatus[activeCandidate.id] === 'matching'}
        jobMatch={
          activeCandidate && selectedJob && matches[activeCandidate.id]
            ? {
                jobTitle: selectedJob.title,
                matchPercentage: matches[activeCandidate.id].match_percentage,
                matchedSkills: matches[activeCandidate.id].matched_skills,
                missingSkills: matches[activeCandidate.id].missing_skills,
                experienceMatch: matches[activeCandidate.id].experience_match,
                educationMatch: matches[activeCandidate.id].education_match,
              }
            : null
        }
        githubLoading={!!activeCandidate && githubLoading[activeCandidate.id]}
        githubIntel={activeCandidate ? githubIntel[activeCandidate.id] ?? null : null}
      />

      <DatasetManagerDialog
        open={datasetManagerOpen}
        onClose={() => setDatasetManagerOpen(false)}
        onImported={loadCandidates}
      />

      <ShortlistDialog
        open={shortlistOpen}
        onClose={() => setShortlistOpen(false)}
        candidates={topCandidates}
        matches={matches}
        onConfirm={handleConfirmShortlist}
      />
    </MainLayout>
  );
}
