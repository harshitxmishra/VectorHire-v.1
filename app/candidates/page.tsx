'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Option,
  MessageBar,
  MessageBarBody,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Sparkle16Regular, DatabaseRegular, ArrowSyncRegular, ArrowTrendingRegular, MailRegular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { DatasetManagerDialog } from '@/components/candidates/DatasetManagerDialog';
import { ShortlistDialog } from '@/components/candidates/ShortlistDialog';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { useCallback, useEffect, useState } from 'react';
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
    marginBottom: tokens.spacingVerticalM,
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
  },
  candidateItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  candidateContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  candidateName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  candidateDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  scoreMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
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
    minWidth: '260px',
  },
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';
type MatchStatus = 'not_matched' | 'matching' | 'matched' | 'error';

export default function CandidatesPage() {
  const styles = useStyles();

  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetManagerOpen, setDatasetManagerOpen] = useState(false);

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
      setTopCandidates(data);

      const seededEvaluations: Record<number, AIEvaluationResult> = {};
      const seededStatus: Record<number, EvaluationStatus> = {};
      data.forEach((candidate) => {
        if (candidate.ai_evaluation) {
          seededEvaluations[candidate.id] = candidate.ai_evaluation;
          seededStatus[candidate.id] = 'evaluated';
        }
      });
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

    fetch(`/api/job-matches?jobDescriptionId=${selectedJobId}`)
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
      const response = await fetch('/api/ai/evaluate', {
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
        const response = await fetch('/api/ai/match', {
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

  const runGithubAnalysis = useCallback(async (candidate: Candidate) => {
    if (!candidate.github) return;
    setGithubLoading((prev) => ({ ...prev, [candidate.id]: true }));

    try {
      const response = await fetch('/api/ai/github', {
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
  }, [notify, loadCandidates]);

  const handleRetryResume = async (candidate: Candidate) => {
    setResumeParsing((prev) => ({ ...prev, [candidate.id]: true }));

    try {
      const res = await fetch(`/api/candidates/${candidate.id}/parse-resume`, { method: 'POST' });
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
      setTopCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus } : c)));
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
      const res = await fetch('/api/emails/send', {
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

  const selectedJob = jobDescriptions.find((jd) => jd.id === selectedJobId) ?? null;

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Candidates</Title2>
          <div className={styles.headerActions}>
            <Dropdown
              className={styles.jdSelector}
              placeholder="Match against job description..."
              value={selectedJob?.title ?? ''}
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
            <Button appearance="secondary" icon={<ArrowTrendingRegular />} onClick={() => setShortlistOpen(true)}>
              Generate Shortlist
            </Button>
            <Button
              appearance="secondary"
              icon={<MailRegular />}
              disabled={sendingEmail}
              onClick={() => handleBulkEmail('assessment')}
            >
              Send Assessment ({selectedIds.size})
            </Button>
            <Button
              appearance="secondary"
              icon={<MailRegular />}
              disabled={sendingEmail}
              onClick={() => handleBulkEmail('offer')}
            >
              Send Offer ({selectedIds.size})
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

        <ChartContainer title="Top Candidates" subtitle="Ranked by AI match score">
          {loading ? (
            <p>Loading candidates...</p>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacingVerticalM,
              }}
            >
              {topCandidates.map((candidate) => (
                <div key={candidate.id} className={styles.candidateItem}>
                  <Checkbox
                    checked={selectedIds.has(candidate.id)}
                    onChange={() => toggleSelected(candidate.id)}
                  />
                  <div className={styles.candidateContent}>
                    <div className={styles.candidateName}>{candidate.full_name}</div>
                    <div className={styles.candidateDesc}>
                      {candidate.college} • {candidate.email}
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
                              ? tokens.colorPaletteGreenForeground1
                              : candidate.ai_score >= 70
                              ? tokens.colorPaletteYellowForeground1
                              : tokens.colorPaletteRedForeground1,
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
                        ? 'AI Analysis Ready'
                        : evaluationStatus[candidate.id] === 'evaluating'
                        ? 'Evaluating...'
                        : evaluationStatus[candidate.id] === 'error'
                        ? 'Evaluation Failed'
                        : 'Not Evaluated'}
                    </Badge>

                    {candidate.github_portfolio_verdict ? (
                      <Badge appearance="tint" color="brand">
                        GitHub: {candidate.github_portfolio_verdict}
                      </Badge>
                    ) : null}

                    <Dropdown
                      style={{ minWidth: '170px' }}
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
                      AI Analysis
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartContainer>
      </div>

      <CandidateInsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={!!activeCandidate && evaluationStatus[activeCandidate.id] === 'evaluating'}
        candidateId={activeCandidate?.id}
        candidateName={activeCandidate?.full_name ?? ''}
        errorMessage={
          activeCandidate && evaluationStatus[activeCandidate.id] === 'error' ? evaluationError : null
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
