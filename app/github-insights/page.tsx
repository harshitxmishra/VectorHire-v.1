'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2, Badge, Button, Input, Body1, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowSyncRegular, SearchRegular } from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useCallback, useEffect, useState } from 'react';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { Candidate, GitHubIntelligence } from '@/lib/types';
import { safeParseApiResponse } from '@/lib/utils/api-client';

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: { marginBottom: tokens.spacingVerticalM },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  meta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  name: { fontWeight: 600, color: tokens.colorNeutralForeground1 },
  scoreCol: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
});

export default function GitHubInsightsPage() {
  const styles = useStyles();
  const notify = useAppToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [searchUrl, setSearchUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<GitHubIntelligence | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const runSearch = async () => {
    if (!searchUrl.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await fetch('/api/ai/github/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github: searchUrl.trim() }),
      });
      const body = await safeParseApiResponse<GitHubIntelligence>(res);
      setSearchResult(body);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'GitHub analysis failed.');
    } finally {
      setSearching(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      const body = await safeParseApiResponse<Candidate[] | { data: Candidate[] }>(res);
      const list = Array.isArray(body) ? body : (body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) ? body.data : [];
      setCandidates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withGithub = candidates.filter((c) => c.github);
  const analyzed = withGithub.filter((c) => c.github_score !== null);
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((sum, c) => sum + (c.github_score ?? 0), 0) / analyzed.length)
    : 0;

  const analyze = async (candidate: Candidate) => {
    setAnalyzing((prev) => ({ ...prev, [candidate.id]: true }));
    try {
      const res = await fetch('/api/ai/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      const body = await safeParseApiResponse<{ score?: number; result?: { score?: number }; status?: string; jobId?: string }>(res);

      let score = body.score;

      if (body.status === 'completed' && body.result) {
        score = body.result.score;
      } else if (body.status === 'queued' && body.jobId) {
        let attempts = 0;
        const maxAttempts = 60;
        let completed = false;

        while (attempts < maxAttempts && !completed) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;

          const pollRes = await fetch(`/api/v1/ai/github/jobs/${body.jobId}`);
          if (!pollRes.ok) continue;
          const pollData = await safeParseApiResponse<{ state?: string; result?: { score?: number }; error?: string }>(pollRes);

          if (pollData.state === 'completed') {
            score = pollData.result?.score;
            completed = true;
          } else if (pollData.state === 'failed') {
            throw new Error(pollData.error || 'GitHub analysis failed.');
          }
        }

        if (!completed) {
          throw new Error('GitHub analysis timed out. Please try again.');
        }
      }

      notify(`GitHub analysis complete — score ${score ?? 0}/100`, 'success');
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'GitHub analysis failed.', 'error');
    } finally {
      setAnalyzing((prev) => ({ ...prev, [candidate.id]: false }));
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>GitHub Insights</Title2>
        </div>

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}

        <ChartContainer title="Analyze Any GitHub Profile" subtitle="Look up and score a profile that isn't in your candidate dataset">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' }}>
              <Input
                placeholder="GitHub profile URL or username"
                value={searchUrl}
                onChange={(_, data) => setSearchUrl(data.value)}
                style={{ flex: 1, minWidth: '240px' }}
              />
              <Button appearance="primary" icon={<SearchRegular />} disabled={searching} onClick={runSearch}>
                {searching ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {searchError ? (
              <MessageBar intent="error">
                <MessageBarBody>{searchError}</MessageBarBody>
              </MessageBar>
            ) : null}

            {searchResult ? (
              <div className={styles.item}>
                <div>
                  <div className={styles.name}>{searchResult.portfolioVerdict}</div>
                  <Body1>{searchResult.summary}</Body1>
                  <div className={styles.meta}>
                    {searchResult.languages.join(', ') || 'No languages detected'}
                    {searchResult.strongestRepo ? ` • Strongest repo: ${searchResult.strongestRepo}` : ''}
                  </div>
                </div>
                <Badge appearance="filled" color="brand">
                  {searchResult.score}/100
                </Badge>
              </div>
            ) : null}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Portfolio Overview"
          subtitle={`${analyzed.length} of ${withGithub.length} GitHub profiles analyzed • avg score ${avgScore}`}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {loading ? (
              <p>Loading...</p>
            ) : withGithub.length === 0 ? (
              <p>No candidates with a GitHub profile yet.</p>
            ) : (
              withGithub
                .sort((a, b) => (b.github_score ?? -1) - (a.github_score ?? -1))
                .map((candidate) => (
                  <div key={candidate.id} className={styles.item}>
                    <div>
                      <div className={styles.name}>{candidate.full_name}</div>
                      <div className={styles.meta}>
                        {candidate.github_languages?.length
                          ? candidate.github_languages.join(', ')
                          : 'No languages detected yet'}
                      </div>
                    </div>
                    <div className={styles.scoreCol}>
                      {candidate.github_score !== null ? (
                        <>
                          <Badge appearance="filled" color="brand">
                            {candidate.github_score}/100
                          </Badge>
                          <Badge appearance="tint" color="informative">
                            {candidate.github_portfolio_verdict}
                          </Badge>
                        </>
                      ) : (
                        <Badge appearance="tint" color="subtle">
                          Not analyzed
                        </Badge>
                      )}
                      <Button
                        appearance="secondary"
                        size="small"
                        icon={<ArrowSyncRegular />}
                        disabled={analyzing[candidate.id]}
                        onClick={() => analyze(candidate)}
                      >
                        {analyzing[candidate.id] ? 'Analyzing...' : candidate.github_score !== null ? 'Re-analyze' : 'Analyze'}
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ChartContainer>
      </div>
    </MainLayout>
  );
}
