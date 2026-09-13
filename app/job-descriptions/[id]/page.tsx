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
  Dropdown,
  Option,
  Badge,
  Spinner,
  Tag,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  SearchRegular,
  FilterRegular,
  SparkleRegular,
  DismissRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  OpenRegular,
  DocumentBulletListRegular,
  PeopleRegular,
  CheckmarkCircleRegular,
  ArrowClockwiseRegular,
} from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { JobDescription, PIPELINE_STAGES } from '@/lib/types';
import { JobMatchWithCandidate, JobMatchMetrics } from '@/lib/repositories/job-match-repository';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  headerBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.2)'),
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  requirementsBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.1)'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap',
    maxHeight: '160px',
    overflowY: 'auto',
    lineHeight: '1.5',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '1.2',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  matchCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
    transition: `all ${tokens.durationFast}`,
    ':hover': {
      backgroundColor: 'rgba(39, 54, 78, 0.85)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.35)'),
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  candidateLink: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ':hover': {
      color: '#818cf8',
      textDecoration: 'underline',
    },
  },
  explainabilitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  alignmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: tokens.borderRadiusSmall,
  },
  recommendationBox: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: '3px solid #6366f1',
  },
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    padding: '48px 24px',
    textAlign: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'dashed', 'rgba(148, 163, 184, 0.2)'),
  },
});

function JobDetailContent() {
  const styles = useStyles();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const jobId = Number(params?.id);

  // Job Data
  const [job, setJob] = useState<JobDescription | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  // Matches Data
  const [matches, setMatches] = useState<JobMatchWithCandidate[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState<JobMatchMetrics>({
    totalMatches: 0,
    highMatchCount: 0,
    averageMatchScore: null,
  });
  const [candidateCount, setCandidateCount] = useState(0);
  const [totalMatchesForJob, setTotalMatchesForJob] = useState(0);

  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // Matching Execution State
  const [matchingRunning, setMatchingRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; intent: 'success' | 'error' | 'info' } | null>(null);

  // URL state parameters
  const urlSearch = searchParams.get('search') ?? '';
  const urlMinScore = searchParams.has('minScore') ? Number(searchParams.get('minScore')) : 0;
  const urlStatus = searchParams.get('status') ?? 'all';
  const urlCollege = searchParams.get('college') ?? 'all';
  const urlSortBy = searchParams.get('sortBy') ?? 'match_percentage';
  const urlSortOrder = searchParams.get('sortOrder') ?? 'desc';
  const urlPage = searchParams.has('page') ? Math.max(1, Number(searchParams.get('page'))) : 1;
  const urlLimit = searchParams.has('limit') ? Math.max(1, Number(searchParams.get('limit'))) : 25;

  const [searchInput, setSearchInput] = useState(urlSearch);

  const notify = (text: string, intent: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, intent });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // URL updater with auto-page reset
  const updateQueryParams = useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = false) => {
      const sp = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all' || value === 0) {
          sp.delete(key);
        } else {
          sp.set(key, String(value));
        }
      });

      if (resetPage) {
        sp.delete('page');
      }

      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateQueryParams({ search: searchInput.trim() }, true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateQueryParams]);

  // Load Job
  const loadJob = useCallback(async () => {
    if (!Number.isFinite(jobId) || jobId <= 0) {
      setJobError('Invalid Job ID.');
      setJobLoading(false);
      return;
    }

    setJobLoading(true);
    setJobError(null);
    try {
      const res = await fetch(`/api/job-descriptions/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Job description not found.');
        throw new Error('Failed to load job description.');
      }
      const data = await res.json();
      setJob(data);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : 'Failed to load job description.');
    } finally {
      setJobLoading(false);
    }
  }, [jobId]);

  // Load Paginated Matches
  const loadMatches = useCallback(async () => {
    if (!Number.isFinite(jobId) || jobId <= 0) return;

    setMatchesLoading(true);
    setMatchesError(null);

    try {
      const params = new URLSearchParams();
      params.set('jobDescriptionId', String(jobId));
      if (urlSearch) params.set('search', urlSearch);
      if (urlMinScore > 0) params.set('minScore', String(urlMinScore));
      if (urlStatus && urlStatus !== 'all') params.set('status', urlStatus);
      if (urlCollege && urlCollege !== 'all') params.set('college', urlCollege);
      if (urlSortBy) params.set('sortBy', urlSortBy);
      if (urlSortOrder) params.set('sortOrder', urlSortOrder);
      params.set('page', String(urlPage));
      params.set('limit', String(urlLimit));

      const res = await fetch(`/api/job-matches?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load matching candidates (${res.status})`);
      }

      const body = await res.json();

      if (body && Array.isArray(body.matches)) {
        setMatches(body.matches);
        setTotalMatches(body.total ?? body.matches.length);
        setTotalPages(body.totalPages ?? 1);
        if (body.metrics) {
          setMetrics(body.metrics);
        }
        setCandidateCount(body.candidateCount ?? 0);
        setTotalMatchesForJob(body.totalMatchesForJob ?? body.total ?? 0);
      } else if (Array.isArray(body)) {
        setMatches(body as any);
        setTotalMatches(body.length);
        setTotalPages(1);
        setMetrics({
          totalMatches: body.length,
          highMatchCount: body.filter((m: any) => Number(m.match_percentage) >= 80).length,
          averageMatchScore:
            body.length > 0
              ? Math.round(body.reduce((sum: number, m: any) => sum + Number(m.match_percentage), 0) / body.length)
              : null,
        });
        setTotalMatchesForJob(body.length);
      }
    } catch (err) {
      setMatchesError(err instanceof Error ? err.message : 'Failed to load matching candidates.');
    } finally {
      setMatchesLoading(false);
    }
  }, [jobId, urlSearch, urlMinScore, urlStatus, urlCollege, urlSortBy, urlSortOrder, urlPage, urlLimit]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Run/Refresh AI Matching
  const handleRunMatching = async (force = false) => {
    if (matchingRunning) return;
    setMatchingRunning(true);
    notify('Running AI matching across candidate pool...', 'info');

    try {
      const res = await fetch('/api/job-matches/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description_id: jobId,
          force,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'AI matching failed.');
      }

      notify(`Matching complete: ${body.evaluated} candidate(s) evaluated.`, 'success');
      await loadMatches();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Matching failed.', 'error');
    } finally {
      setMatchingRunning(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' };
    if (score >= 65) return { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15', border: 'rgba(234, 179, 8, 0.4)' };
    return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
  };

  if (jobLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner label="Loading position details..." />
        </div>
      </MainLayout>
    );
  }

  if (jobError || !job) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <Title2 style={{ color: '#f87171' }}>{jobError || 'Job Not Found'}</Title2>
            <Body1>The requested job description could not be found.</Body1>
            <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
              <Button appearance="primary" icon={<ArrowLeftRegular />}>
                Return to Job Descriptions
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Navigation & Header Banner */}
        <div className={styles.headerBanner}>
          <div className={styles.headerTop}>
            <div className={styles.titleGroup}>
              <Link href="/job-descriptions" style={{ textDecoration: 'none' }}>
                <Button appearance="subtle" icon={<ArrowLeftRegular />}>
                  Jobs
                </Button>
              </Link>
              <div>
                <Title2>{job.title}</Title2>
                <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                  Created on {new Date(job.created_at).toLocaleDateString()}
                </Caption1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                appearance="primary"
                icon={matchingRunning ? <Spinner size="tiny" /> : <SparkleRegular />}
                disabled={matchingRunning}
                onClick={() => handleRunMatching(false)}
              >
                {matchingRunning ? 'Running AI Matching...' : 'Run AI Matching'}
              </Button>

              <Button
                appearance="secondary"
                icon={<ArrowClockwiseRegular />}
                disabled={matchingRunning}
                onClick={() => handleRunMatching(true)}
              >
                Recompute All
              </Button>
            </div>
          </div>

          <div>
            <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground3, marginBottom: '4px', display: 'block' }}>
              Position Requirements & Target Skills:
            </Caption1>
            <div className={styles.requirementsBox}>{job.requirements}</div>
          </div>
        </div>

        {/* Notifications */}
        {toastMessage && (
          <MessageBar intent={toastMessage.intent}>
            <MessageBarBody>{toastMessage.text}</MessageBarBody>
          </MessageBar>
        )}

        {/* Top Whole-Dataset Metrics Bar */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase', fontWeight: 600 }}>
              Total Matched
            </Caption1>
            <div className={styles.metricValue} style={{ color: '#818cf8' }}>
              {metrics.totalMatches}
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
              Across {candidateCount} candidate pool
            </Caption1>
          </div>

          <div className={styles.metricCard}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase', fontWeight: 600 }}>
              High Matches (≥80%)
            </Caption1>
            <div className={styles.metricValue} style={{ color: '#34d399' }}>
              {metrics.highMatchCount}
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
              Strong alignment candidates
            </Caption1>
          </div>

          <div className={styles.metricCard}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase', fontWeight: 600 }}>
              Average Match Score
            </Caption1>
            <div className={styles.metricValue} style={{ color: '#fbbf24' }}>
              {metrics.averageMatchScore !== null ? `${metrics.averageMatchScore}%` : 'N/A'}
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
              Role suitability index
            </Caption1>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <Input
              placeholder="Search candidate name, email, college..."
              contentBefore={<SearchRegular />}
              value={searchInput}
              onChange={(_, data) => setSearchInput(data.value)}
              style={{ minWidth: '260px' }}
            />

            <Dropdown
              placeholder="Min Match Score"
              value={urlMinScore > 0 ? `Score ≥ ${urlMinScore}%` : 'All Scores'}
              selectedOptions={[String(urlMinScore)]}
              onOptionSelect={(_, data) => updateQueryParams({ minScore: Number(data.optionValue) }, true)}
              style={{ minWidth: '150px' }}
            >
              <Option key="0" value="0" text="All Scores">
                All Scores
              </Option>
              <Option key="70" value="70" text="Score ≥ 70%">
                Score ≥ 70%
              </Option>
              <Option key="80" value="80" text="Score ≥ 80%">
                Score ≥ 80% (High)
              </Option>
              <Option key="90" value="90" text="Score ≥ 90%">
                Score ≥ 90% (Top)
              </Option>
            </Dropdown>

            <Dropdown
              placeholder="Pipeline Status"
              value={urlStatus !== 'all' ? urlStatus : 'All Statuses'}
              selectedOptions={[urlStatus]}
              onOptionSelect={(_, data) => updateQueryParams({ status: data.optionValue as string }, true)}
              style={{ minWidth: '160px' }}
            >
              <Option key="all" value="all" text="All Statuses">
                All Statuses
              </Option>
              {PIPELINE_STAGES.map((s) => (
                <Option key={s} value={s.toLowerCase()} text={s}>
                  {s}
                </Option>
              ))}
            </Dropdown>

            <Dropdown
              placeholder="Sort By"
              value={
                urlSortBy === 'match_percentage'
                  ? urlSortOrder === 'asc'
                    ? 'Score: Low to High'
                    : 'Score: High to Low'
                  : urlSortBy === 'evaluated_at'
                  ? 'Evaluation Date'
                  : 'Candidate ID'
              }
              selectedOptions={[`${urlSortBy}_${urlSortOrder}`]}
              onOptionSelect={(_, data) => {
                const val = data.optionValue as string;
                if (val === 'score_desc') updateQueryParams({ sortBy: 'match_percentage', sortOrder: 'desc' }, true);
                if (val === 'score_asc') updateQueryParams({ sortBy: 'match_percentage', sortOrder: 'asc' }, true);
                if (val === 'evaluated_at') updateQueryParams({ sortBy: 'evaluated_at', sortOrder: 'desc' }, true);
                if (val === 'id') updateQueryParams({ sortBy: 'id', sortOrder: 'asc' }, true);
              }}
              style={{ minWidth: '180px' }}
            >
              <Option key="score_desc" value="score_desc" text="Score: High to Low">
                Score: High to Low
              </Option>
              <Option key="score_asc" value="score_asc" text="Score: Low to High">
                Score: Low to High
              </Option>
              <Option key="evaluated_at" value="evaluated_at" text="Evaluation Date">
                Evaluation Date
              </Option>
              <Option key="id" value="id" text="Candidate ID">
                Candidate ID
              </Option>
            </Dropdown>
          </div>

          {(urlSearch || urlMinScore > 0 || urlStatus !== 'all' || urlCollege !== 'all') && (
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => {
                setSearchInput('');
                router.push(pathname);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results / Empty / Error State */}
        <ChartContainer
          title={`Matched Talent (${totalMatches} Filtered)`}
          subtitle="Ranked candidate profiles with explainable skill overlap and recruitment recommendations"
        >
          {matchesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Spinner label="Loading match results from server..." />
            </div>
          ) : matchesError ? (
            <div className={styles.emptyState}>
              <Title3 style={{ color: '#f87171' }}>Error Loading Matches</Title3>
              <Body2>{matchesError}</Body2>
              <Button appearance="primary" onClick={() => loadMatches()}>
                Retry
              </Button>
            </div>
          ) : candidateCount === 0 ? (
            <div className={styles.emptyState}>
              <PeopleRegular style={{ fontSize: '48px', color: '#94a3b8' }} />
              <Title3>No Candidates in Database</Title3>
              <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                Upload candidate datasets from the Candidates page before running job matches.
              </Body2>
              <Link href="/candidates" style={{ textDecoration: 'none' }}>
                <Button appearance="primary">Go to Candidates</Button>
              </Link>
            </div>
          ) : totalMatchesForJob === 0 ? (
            <div className={styles.emptyState}>
              <SparkleRegular style={{ fontSize: '48px', color: '#818cf8' }} />
              <Title3>No Matches Calculated Yet</Title3>
              <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                Evaluate candidates against this job description to see ranked match scores and skill overlap.
              </Body2>
              <Button
                appearance="primary"
                icon={<SparkleRegular />}
                disabled={matchingRunning}
                onClick={() => handleRunMatching(false)}
              >
                {matchingRunning ? 'Evaluating Candidates...' : 'Run AI Matching Now'}
              </Button>
            </div>
          ) : matches.length === 0 ? (
            <div className={styles.emptyState}>
              <FilterRegular style={{ fontSize: '48px', color: '#94a3b8' }} />
              <Title3>No Candidates Meet Current Filter Criteria</Title3>
              <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                Try lowering the minimum match score or clearing active search terms.
              </Body2>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={() => {
                  setSearchInput('');
                  router.push(pathname);
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className={styles.matchList}>
              {matches.map((item) => {
                const c = item.candidate;
                const colors = getScoreBadgeColor(Number(item.match_percentage));

                return (
                  <div key={item.id} className={styles.matchCard}>
                    {/* Header Row */}
                    <div className={styles.cardHeader}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Link href={`/candidates/${c?.id || item.candidate_id}`} className={styles.candidateLink}>
                            {c?.full_name || `Candidate #${item.candidate_id}`}
                          </Link>
                          {c?.status && (
                            <Badge appearance="tint" color="informative">
                              {c.status}
                            </Badge>
                          )}
                        </div>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          {c?.email} • {c?.college} {c?.branch ? `(${c.branch})` : ''}
                        </Caption1>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            fontWeight: 700,
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{item.match_percentage}%</span>
                          <Caption1 style={{ color: colors.text, fontWeight: 600 }}>Match</Caption1>
                        </div>

                        <Link href={`/candidates/${c?.id || item.candidate_id}`} style={{ textDecoration: 'none' }}>
                          <Button appearance="subtle" icon={<OpenRegular />} size="small">
                            Profile
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Explainability Breakdown */}
                    <div className={styles.explainabilitySection}>
                      {/* Skills Overlap */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Caption1 style={{ fontWeight: 600, color: '#94a3b8' }}>Matched Skills:</Caption1>
                          <div className={styles.tagGroup}>
                            {Array.isArray(item.matched_skills) && item.matched_skills.length > 0 ? (
                              item.matched_skills.map((s) => (
                                <Tag
                                  key={s}
                                  appearance="filled"
                                  style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                  }}
                                >
                                  ✓ {s}
                                </Tag>
                              ))
                            ) : (
                              <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>None listed</Caption1>
                            )}
                          </div>
                        </div>

                        {Array.isArray(item.missing_skills) && item.missing_skills.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Caption1 style={{ fontWeight: 600, color: '#94a3b8' }}>Missing Skills:</Caption1>
                            <div className={styles.tagGroup}>
                              {item.missing_skills.map((s) => (
                                <Tag
                                  key={s}
                                  appearance="filled"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                  }}
                                >
                                  ✕ {s}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Alignment Breakdown */}
                      <div className={styles.alignmentGrid}>
                        <div>
                          <Caption1 style={{ color: '#94a3b8', display: 'block' }}>Experience Alignment</Caption1>
                          <Body2 style={{ color: tokens.colorNeutralForeground1, fontWeight: 500 }}>
                            {item.experience_match}
                          </Body2>
                        </div>
                        <div>
                          <Caption1 style={{ color: '#94a3b8', display: 'block' }}>Education Match</Caption1>
                          <Body2 style={{ color: tokens.colorNeutralForeground1, fontWeight: 500 }}>
                            {item.education_match}
                          </Body2>
                        </div>
                      </div>

                      {/* Recommendation */}
                      {item.recommendation && (
                        <div className={styles.recommendationBox}>
                          <Caption1 style={{ color: '#818cf8', fontWeight: 600, display: 'block' }}>
                            Recruiter Recommendation:
                          </Caption1>
                          <Body2 style={{ color: '#e2e8f0' }}>{item.recommendation}</Body2>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing Page {urlPage} of {totalPages} ({totalMatches} candidates)
                  </Caption1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      appearance="subtle"
                      icon={<ChevronLeftRegular />}
                      disabled={urlPage <= 1}
                      onClick={() => updateQueryParams({ page: urlPage - 1 })}
                    >
                      Previous
                    </Button>
                    <Caption1 style={{ fontWeight: 600 }}>{urlPage}</Caption1>
                    <Button
                      appearance="subtle"
                      icon={<ChevronRightRegular />}
                      disabled={urlPage >= totalPages}
                      onClick={() => updateQueryParams({ page: urlPage + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ChartContainer>
      </div>
    </MainLayout>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner label="Loading position workspace..." />
          </div>
        </MainLayout>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
