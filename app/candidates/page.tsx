'use client';

import { MainLayout } from '@/components/layout/main-layout';
import {
  Badge,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Sparkle16Regular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { BadgeStatus } from '@/components/ui/badge-status';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Candidate, AIEvaluationResult } from '@/lib/types';

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
  },
  candidateItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  hiddenInput: {
    display: 'none',
  },
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';

export default function CandidatesPage() {
  const styles = useStyles();

  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [evaluations, setEvaluations] = useState<Record<number, AIEvaluationResult>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<Record<number, EvaluationStatus>>({});
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      const data: Candidate[] = await res.json();

      setTopCandidates(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load candidates.';

      alert(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

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

  const handleViewAnalysis = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDrawerOpen(true);

    if (!evaluations[candidate.id]) {
      runEvaluation(candidate);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'CSV import failed.');
      }

      await loadCandidates();
      setSuccessMessage(
        `CSV uploaded successfully. Imported ${result.inserted} candidates.`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>Candidates</Title2>
          <Button appearance="primary" onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />

        {successMessage ? (
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>Import complete</MessageBarTitle>
              {successMessage}
            </MessageBarBody>
          </MessageBar>
        ) : null}

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
                  <div className={styles.candidateContent}>
                    <div className={styles.candidateName}>
                      {candidate.full_name}
                    </div>

                    <div className={styles.candidateDesc}>
                      {candidate.college} • {candidate.email}
                    </div>
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

                    <BadgeStatus status={candidate.status} />

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
        loading={
          !!activeCandidate && evaluationStatus[activeCandidate.id] === 'evaluating'
        }
        candidateName={activeCandidate?.full_name ?? ''}
        errorMessage={
          activeCandidate && evaluationStatus[activeCandidate.id] === 'error'
            ? evaluationError
            : null
        }
        onRetry={activeCandidate ? () => runEvaluation(activeCandidate) : undefined}
        data={activeCandidate ? evaluations[activeCandidate.id] : undefined}
      />
    </MainLayout>
  );
}
