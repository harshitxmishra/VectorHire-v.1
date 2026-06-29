'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, MessageBar, MessageBarBody, Button } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Sparkle16Regular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { useAppData } from '@/lib/hooks/use-app-data';
import { useCallback, useState } from 'react';
import { Candidate, AIEvaluationResult } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
  },
  evaluationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
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
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';

export default function AIEvaluationPage() {
  const styles = useStyles();
  const { candidates, loading, error } = useAppData();
  const topCandidates = [...candidates].sort((a, b) => b.ai_score - a.ai_score).slice(0, 8);

  const [evaluations, setEvaluations] = useState<Record<number, AIEvaluationResult>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<Record<number, EvaluationStatus>>({});
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const handleAnalyze = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDrawerOpen(true);

    if (!evaluations[candidate.id]) {
      runEvaluation(candidate);
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>AI Evaluation Queue</Title2>
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
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<Sparkle16Regular />}
                    onClick={() => handleAnalyze(candidate)}
                  >
                    Analyze
                  </Button>
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
      />
    </MainLayout>
  );
}
