'use client';

import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  Spinner,
} from '@fluentui/react-components';
import {
  Sparkle16Regular,
  DatabaseRegular,
  ArrowSyncRegular,
  ArrowTrendingRegular,
  SearchRegular,
  TableSimple24Regular,
  Board24Regular,
  Filter20Regular,
  DismissRegular,
  CheckmarkRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  PersonRegular,
  DocumentTextRegular,
} from '@fluentui/react-icons';
import { ChartContainer } from '@/components/ui/chart-container';
import CandidateInsightsDrawer from '@/components/ai/CandidateInsightsDrawer';
import { DatasetManagerDialog } from '@/components/candidates/DatasetManagerDialog';
import { ShortlistDialog } from '@/components/candidates/ShortlistDialog';
import { CandidateKanban } from '@/components/candidates/CandidateKanban';
import { useAppToast } from '@/lib/hooks/use-app-toast';
import { safeParseApiResponse } from '@/lib/utils/api-client';
import {
  Candidate,
  AIEvaluationResult,
  JobDescription,
  JobMatchResult,
  GitHubIntelligence,
  PIPELINE_STAGES,
} from '@/lib/types';
import {
  PaginatedCandidates,
  CandidateSortField,
  CandidateSortOrder,
} from '@/lib/repositories/candidate-repository';

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
  bulkToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(99, 102, 241, 0.35)'),
    animationName: {
      from: { opacity: 0, transform: 'translateY(-4px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animationDuration: '200ms',
  },
  bulkActionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
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
  candidateNameLink: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    textDecoration: 'none',
    ':hover': {
      color: '#818cf8',
      textDecoration: 'underline',
    },
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
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'dashed', 'rgba(148, 163, 184, 0.2)'),
  },
});

type EvaluationStatus = 'not_evaluated' | 'evaluating' | 'evaluated' | 'error';
type MatchStatus = 'not_matched' | 'matching' | 'matched' | 'error';

function CandidatesContent() {
  const styles = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notify = useAppToast();
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // Read URL query parameters
  const urlSearch = searchParams.get('search') ?? '';
  const urlStatus = searchParams.get('status') ?? 'all';
  const urlCollege = searchParams.get('college') ?? 'all';
  const urlMinScore = Number(searchParams.get('minScore') ?? 0);
  const urlSortBy = (searchParams.get('sortBy') as CandidateSortField) ?? 'ai_score';
  const urlSortOrder = (searchParams.get('sortOrder') as CandidateSortOrder) ?? 'desc';
  const urlPage = Math.max(1, Number(searchParams.get('page') ?? 1));
  const urlLimit = Math.min(100, Math.max(10, Number(searchParams.get('limit') ?? 20)));

  // Local state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [datasetManagerOpen, setDatasetManagerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Multi-selection (visible page only)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('Shortlisted');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // AI evaluation & Matching drawer state
  const [evaluations, setEvaluations] = useState<Record<number, AIEvaluationResult>>({});
  const [evaluationStatus, setEvaluationStatus] = useState<Record<number, EvaluationStatus>>({});
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, JobMatchResult>>({});
  const [matchStatus, setMatchStatus] = useState<Record<number, MatchStatus>>({});
  const [githubIntel, setGithubIntel] = useState<Record<number, GitHubIntelligence>>({});
  const [githubLoading, setGithubLoading] = useState<Record<number, boolean>>({});

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Update URL helper (automatically resets to page 1 on filter/search change)
  const updateQueryParams = useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all' || value === 0) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      if (resetPage) {
        params.delete('page');
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      if (newUrl !== currentUrl) {
        router.push(newUrl);
      }
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

  // Authoritative candidate fetching effect with stale request protection
  useEffect(() => {
    let isCancelled = false;

    async function fetchCandidates() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (urlSearch) params.set('search', urlSearch);
        if (urlStatus && urlStatus !== 'all') params.set('status', urlStatus);
        if (urlCollege && urlCollege !== 'all') params.set('college', urlCollege);
        if (urlMinScore > 0) params.set('minScore', String(urlMinScore));
        if (urlSortBy) params.set('sortBy', urlSortBy);
        if (urlSortOrder) params.set('sortOrder', urlSortOrder);
        params.set('page', String(urlPage));
        params.set('limit', String(urlLimit));

        const res = await fetch(`/api/candidates?${params.toString()}`);
        const body = await safeParseApiResponse<PaginatedCandidates | Candidate[]>(res);

        if (isCancelled) return;

        if (body && typeof body === 'object' && 'candidates' in body && Array.isArray(body.candidates)) {
          setCandidates(body.candidates);
          setTotalCount(body.total ?? body.candidates.length);
          setTotalPages(body.totalPages ?? 1);
        } else if (Array.isArray(body)) {
          setCandidates(body);
          setTotalCount(body.length);
          setTotalPages(1);
        } else {
          setCandidates([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        setSelectedIds(new Set());
      } catch (err) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : 'Error fetching candidates';
        setError(msg);
        notifyRef.current(msg, 'error');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchCandidates();

    return () => {
      isCancelled = true;
    };
  }, [urlSearch, urlStatus, urlCollege, urlMinScore, urlSortBy, urlSortOrder, urlPage, urlLimit, refreshIndex]);

  // Fetch job descriptions once on mount
  useEffect(() => {
    let isCancelled = false;
    async function fetchJobDescriptions() {
      try {
        const res = await fetch('/api/job-descriptions');
        const body = await safeParseApiResponse<JobDescription[]>(res);
        if (!isCancelled) {
          setJobDescriptions(Array.isArray(body) ? body : []);
        }
      } catch (err) {
        console.error('Failed to load job descriptions:', err);
      }
    }
    fetchJobDescriptions();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Single candidate status change
  const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await safeParseApiResponse<Candidate>(res);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: updated.status || newStatus } : c))
      );
      notifyRef.current(`${candidate.full_name} moved to ${newStatus}`, 'success');
    } catch (err) {
      notifyRef.current(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  // Bulk status change (strictly scoped to status change & clear)
  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) {
      notifyRef.current('Select at least one candidate first.', 'error');
      return;
    }
    setBulkUpdating(true);
    try {
      const res = await fetch('/api/candidates/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: Array.from(selectedIds),
          status: bulkStatus,
        }),
      });
      const body = await safeParseApiResponse<{ updated: number; candidates: Candidate[] }>(res);

      notifyRef.current(`Updated ${body.updated ?? selectedIds.size} candidates to ${bulkStatus}`, 'success');
      setSelectedIds(new Set());
      triggerRefresh();
    } catch (err) {
      notifyRef.current(err instanceof Error ? err.message : 'Bulk status update failed.', 'error');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Selection helpers (Visible page only)
  const isAllVisibleSelected = useMemo(() => {
    if (candidates.length === 0) return false;
    return candidates.every((c) => selectedIds.has(c.id));
  }, [candidates, selectedIds]);

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<number>();
      candidates.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectCandidate = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    router.push(pathname);
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Title2>Candidate Directory</Title2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
              Search, filter, and manage talent pipeline across all stages
            </Caption1>
          </div>

          <div className={styles.headerActions}>
            <TabList
              selectedValue={viewMode}
              onTabSelect={(_, data) => setViewMode(data.value as 'table' | 'kanban')}
            >
              <Tab value="table" icon={<TableSimple24Regular />}>
                Directory
              </Tab>
              <Tab value="kanban" icon={<Board24Regular />}>
                Pipeline
              </Tab>
            </TabList>

            <Button
              appearance="secondary"
              icon={<DatabaseRegular />}
              onClick={() => setDatasetManagerOpen(true)}
            >
              Dataset Manager
            </Button>
            <Button
              appearance="subtle"
              icon={<ArrowSyncRegular />}
              onClick={triggerRefresh}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterInputs}>
            <Input
              placeholder="Search by name, email, college, branch..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              contentBefore={<SearchRegular />}
              style={{ minWidth: '280px', flex: 1 }}
            />

            <Dropdown
              value={urlStatus === 'all' ? 'All Statuses' : urlStatus}
              selectedOptions={[urlStatus]}
              onOptionSelect={(_, data) =>
                updateQueryParams({ status: data.optionValue as string }, true)
              }
              placeholder="Filter by Status"
              style={{ minWidth: '180px' }}
            >
              <Option value="all">All Statuses</Option>
              {PIPELINE_STAGES.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Dropdown>

            <Dropdown
              value={
                urlSortBy === 'ai_score'
                  ? 'Sort: AI Score'
                  : urlSortBy === 'full_name'
                  ? 'Sort: Name'
                  : urlSortBy === 'created_at'
                  ? 'Sort: Created Date'
                  : 'Sort: Test Score'
              }
              selectedOptions={[urlSortBy]}
              onOptionSelect={(_, data) =>
                updateQueryParams({ sortBy: data.optionValue as CandidateSortField }, false)
              }
              style={{ minWidth: '160px' }}
            >
              <Option value="ai_score">Sort: AI Score</Option>
              <Option value="full_name">Sort: Name</Option>
              <Option value="created_at">Sort: Created Date</Option>
              <Option value="test_code">Sort: Test Score</Option>
            </Dropdown>

            <Dropdown
              value={urlSortOrder === 'asc' ? 'Ascending' : 'Descending'}
              selectedOptions={[urlSortOrder]}
              onOptionSelect={(_, data) =>
                updateQueryParams({ sortOrder: data.optionValue as CandidateSortOrder }, false)
              }
              style={{ minWidth: '130px' }}
            >
              <Option value="desc">Descending</Option>
              <Option value="asc">Ascending</Option>
            </Dropdown>

            {(urlSearch || urlStatus !== 'all' || urlSortBy !== 'ai_score' || urlSortOrder !== 'desc') && (
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={clearFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Visible Multi-Select Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className={styles.bulkToolbar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckmarkRegular style={{ color: '#818cf8' }} />
              <Body2 style={{ fontWeight: 600 }}>
                {selectedIds.size} visible candidate{selectedIds.size > 1 ? 's' : ''} selected
              </Body2>
            </div>

            <div className={styles.bulkActionsGroup}>
              <Dropdown
                value={bulkStatus}
                selectedOptions={[bulkStatus]}
                onOptionSelect={(_, data) => setBulkStatus(data.optionValue as string)}
                style={{ minWidth: '170px' }}
              >
                {PIPELINE_STAGES.map((s) => (
                  <Option key={s} value={s} text={`Move to: ${s}`}>
                    Move to: {s}
                  </Option>
                ))}
              </Dropdown>

              <Button
                appearance="primary"
                disabled={bulkUpdating}
                onClick={handleBulkStatusChange}
              >
                {bulkUpdating ? 'Updating...' : 'Apply Status'}
              </Button>

              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* View Mode Rendering */}
        {viewMode === 'kanban' ? (
          <CandidateKanban
            candidates={candidates}
            onStatusChange={handleStatusChange}
            onViewAnalysis={(c) => {
              setActiveCandidate(c);
              setDrawerOpen(true);
            }}
          />
        ) : (
          <ChartContainer title={`Talent Directory (${totalCount} Total)`}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <Spinner label="Loading candidates from server..." />
              </div>
            ) : error ? (
              <div className={styles.emptyState}>
                <Title2 style={{ color: '#f87171' }}>Error Loading Candidates</Title2>
                <Body2>{error}</Body2>
                <Button appearance="primary" onClick={triggerRefresh}>
                  Retry Query
                </Button>
              </div>
            ) : candidates.length === 0 ? (
              <div className={styles.emptyState}>
                <Title2>No Candidates Found</Title2>
                <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                  {urlSearch || urlStatus !== 'all'
                    ? 'No candidates matched your search and filter parameters.'
                    : 'Your workspace currently has no candidate records.'}
                </Body2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {urlSearch || urlStatus !== 'all' ? (
                    <Button appearance="primary" onClick={clearFilters}>
                      Reset All Filters
                    </Button>
                  ) : (
                    <Button
                      appearance="primary"
                      icon={<DatabaseRegular />}
                      onClick={() => setDatasetManagerOpen(true)}
                    >
                      Import Dataset
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Select All Visible Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <Checkbox
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    label={<Caption1>Select All Visible ({candidates.length})</Caption1>}
                  />
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing page {urlPage} of {totalPages}
                  </Caption1>
                </div>

                {/* Candidate List Cards */}
                {candidates.map((c) => (
                  <div key={c.id} className={styles.candidateItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelectCandidate(c.id)}
                      />
                      <div className={styles.candidateContent}>
                        <Link
                          href={`/candidates/${c.id}`}
                          className={styles.candidateNameLink}
                        >
                          {c.full_name}
                        </Link>
                        <span className={styles.candidateDesc}>
                          {c.email} &bull; {c.college || 'College Unspecified'}
                          {c.branch ? ` (${c.branch})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className={styles.scoreContainer}>
                      {c.ai_score !== null && c.ai_score !== undefined ? (
                        <div className={styles.scoreMeta}>
                          <span
                            className={styles.score}
                            style={{
                              color:
                                c.ai_score >= 80
                                  ? '#34d399'
                                  : c.ai_score >= 60
                                  ? '#fbbf24'
                                  : '#f87171',
                            }}
                          >
                            {c.ai_score}
                          </span>
                          <span className={styles.scoreLabel}>AI Fit</span>
                        </div>
                      ) : null}

                      <Dropdown
                        value={c.status}
                        selectedOptions={[c.status]}
                        onOptionSelect={(_, data) =>
                          handleStatusChange(c, data.optionValue as string)
                        }
                        style={{ minWidth: '150px' }}
                      >
                        {PIPELINE_STAGES.map((stage) => (
                          <Option key={stage} value={stage}>
                            {stage}
                          </Option>
                        ))}
                      </Dropdown>

                      <Button
                        appearance="subtle"
                        icon={<Sparkle16Regular />}
                        onClick={() => {
                          setActiveCandidate(c);
                          setDrawerOpen(true);
                        }}
                      >
                        Insights
                      </Button>

                      <Link href={`/candidates/${c.id}`}>
                        <Button appearance="secondary" icon={<PersonRegular />}>
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Pagination Footer */}
                <div className={styles.paginationContainer}>
                  <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing {(urlPage - 1) * urlLimit + 1} -{' '}
                    {Math.min(urlPage * urlLimit, totalCount)} of {totalCount} candidates
                  </Body2>

                  <div className={styles.paginationControls}>
                    <Dropdown
                      value={`${urlLimit} / page`}
                      selectedOptions={[String(urlLimit)]}
                      onOptionSelect={(_, data) =>
                        updateQueryParams({ limit: Number(data.optionValue) }, true)
                      }
                      style={{ minWidth: '110px' }}
                    >
                      <Option value="10">10 / page</Option>
                      <Option value="20">20 / page</Option>
                      <Option value="50">50 / page</Option>
                    </Dropdown>

                    <Button
                      appearance="subtle"
                      icon={<ChevronLeftRegular />}
                      disabled={urlPage <= 1}
                      onClick={() => updateQueryParams({ page: urlPage - 1 })}
                    >
                      Previous
                    </Button>

                    <Caption1 style={{ padding: '0 8px' }}>
                      Page {urlPage} of {totalPages}
                    </Caption1>

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
              </div>
            )}
          </ChartContainer>
        )}

        {/* Dataset Manager Dialog */}
        <DatasetManagerDialog
          open={datasetManagerOpen}
          onClose={() => setDatasetManagerOpen(false)}
          onImported={triggerRefresh}
        />

        {/* Quick Insights Drawer */}
        {activeCandidate && (
          <CandidateInsightsDrawer
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setActiveCandidate(null);
            }}
            loading={evaluationStatus[activeCandidate.id] === 'evaluating'}
            candidateName={activeCandidate.full_name}
            candidateId={activeCandidate.id}
            data={evaluations[activeCandidate.id]}
            jobMatch={matches[activeCandidate.id] ? {
              jobTitle: 'Selected Job',
              matchPercentage: matches[activeCandidate.id].match_percentage,
              matchedSkills: matches[activeCandidate.id].matched_skills || [],
              missingSkills: matches[activeCandidate.id].missing_skills || [],
              experienceMatch: matches[activeCandidate.id].experience_match || 'Good',
              educationMatch: matches[activeCandidate.id].education_match || 'Aligned',
            } : null}
            githubIntel={githubIntel[activeCandidate.id] ? {
              score: githubIntel[activeCandidate.id].score,
              summary: githubIntel[activeCandidate.id].summary,
              languages: githubIntel[activeCandidate.id].languages,
              portfolioVerdict: githubIntel[activeCandidate.id].portfolioVerdict,
              highlights: githubIntel[activeCandidate.id].highlights,
              strongestRepo: githubIntel[activeCandidate.id].strongestRepo,
            } : null}
            githubLoading={githubLoading[activeCandidate.id] || false}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner label="Loading candidate directory..." />
          </div>
        </MainLayout>
      }
    >
      <CandidatesContent />
    </Suspense>
  );
}
