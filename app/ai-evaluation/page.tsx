'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Title2,
  MessageBar,
  MessageBarBody,
  Button,
  Dropdown,
  Option,
  Badge,
} from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Sparkle16Regular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { useAppData } from '@/lib/hooks/use-app-data';
import { useCallback, useEffect, useState } from 'react';
import { Candidate, AIEvaluationResult, JobDescription, JobMatchResult } from '@/lib/types';

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
  evaluationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
  },
  summary: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  jdSelector: {
    minWidth: '260px',
  },
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';
type MatchStatus = 'not_matched' | 'matching' | 'matched' | 'error';

export default function AIEvaluationPage() {
  const styles = useStyles();
  const { candidates, loading, error } = useAppData();
  const topCandidates = [...candidates].sort((a, b) => b.ai_score - a.ai_score).slice(0, 8);

  const [evaluations, setEvaluations] = useState<Record<number, AIEvaluationResult>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<Record<number, EvaluationStatus>>({});
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, JobMatchResult>>({});
  const [matchStatus, setMatchStatus] = useState<Record<number, MatchStatus>>({});

  useEffect(() => {
    fetch('/api/job-descriptions')
      .then((res) => res.json())
      .then((body) => setJobDescriptions(Array.isArray(body) ? body : []))
      .catch((err) => console.error(err));
  }, []);

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

  const runEvaluation = useCallback(async (candidate: Candidate) => {
    setEvaluationStatus((prev) => ({ ...prev, [candidate.id]: 'evaluating' }));
    setEvaluationError(null);

    try {
      const response = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: candidate.full_name,
          college: candidate.college,
          cgpa: candidate.cgpa,
          github: candidate.github ?? '',
          status: candidate.status,
          ai_score: candidate.ai_score,
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

  const handleAnalyze = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDrawerOpen(true);

    if (!evaluations[candidate.id]) {
      runEvaluation(candidate);
    }

    if (selectedJobId && !matches[candidate.id]) {
      runMatch(candidate);
    }
  };

  const selectedJob = jobDescriptions.find((jd) => jd.id === selectedJobId) ?? null;

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>AI Evaluation Queue</Title2>
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
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer
          title="Top Candidates by AI Score"
          subtitle="Run a full AI analysis on demand — results are not stored between sessions"
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading candidates...</p>
            ) : topCandidates.length === 0 ? (
              <p>No candidates yet.</p>
            ) : (
              topCandidates.map((candidate) => (
                <div key={candidate.id} className={styles.evaluationItem}>
                  <div>
                    <div className={styles.summary}>{candidate.full_name}</div>
                    <div className={styles.meta}>
                      {candidate.college} • AI score {candidate.ai_score}
                    </div>
                  </div>
                  <div className={styles.actions}>
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
                    <Button
                      appearance="secondary"
                      size="small"
                      icon={<Sparkle16Regular />}
                      onClick={() => handleAnalyze(candidate)}
                    >
                      Analyze
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartContainer>
      </div>

      <CandidateInsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={!!activeCandidate && evaluationStatus[activeCandidate.id] === 'evaluating'}
        candidateName={activeCandidate?.full_name ?? ''}
        errorMessage={
          activeCandidate && evaluationStatus[activeCandidate.id] === 'error' ? evaluationError : null
        }
        onRetry={activeCandidate ? () => runEvaluation(activeCandidate) : undefined}
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
      />
    </MainLayout>
  );
}
