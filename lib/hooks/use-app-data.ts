'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Candidate, CollegeGroup, KPIData, ScoreBucket } from '@/lib/types';

export interface AppData {
  candidates: Candidate[];
  kpis: KPIData;
  collegeGroups: CollegeGroup[];
  scoreBuckets: ScoreBucket[];
}

const EMPTY_DATA: AppData = {
  candidates: [],
  kpis: {
    totalCandidates: 0,
    shortlisted: 0,
    pendingReview: 0,
    averageAIScore: 0,
    topCollege: '—',
    highScorers: 0,
  },
  collegeGroups: [],
  scoreBuckets: [],
};

function isStatus(candidate: Candidate, status: string) {
  return candidate.status?.toLowerCase() === status;
}

function computeKPIs(candidates: Candidate[]): KPIData {
  const totalCandidates = candidates.length;
  const shortlisted = candidates.filter((c) => isStatus(c, 'shortlisted')).length;
  const pendingReview = candidates.filter((c) => isStatus(c, 'pending')).length;
  const averageAIScore = totalCandidates
    ? Math.round(candidates.reduce((sum, c) => sum + (c.ai_score ?? 0), 0) / totalCandidates)
    : 0;
  const highScorers = candidates.filter((c) => (c.ai_score ?? 0) >= 85).length;

  const collegeCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    collegeCounts[c.college] = (collegeCounts[c.college] ?? 0) + 1;
  });
  const topCollege =
    Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return { totalCandidates, shortlisted, pendingReview, averageAIScore, topCollege, highScorers };
}

function computeCollegeGroups(candidates: Candidate[]): CollegeGroup[] {
  const groups = new Map<string, Candidate[]>();

  candidates.forEach((c) => {
    const key = c.college || 'Unknown';
    groups.set(key, [...(groups.get(key) ?? []), c]);
  });

  return Array.from(groups.entries())
    .map(([college, group]) => ({
      college,
      totalCandidates: group.length,
      shortlistedCount: group.filter((c) => isStatus(c, 'shortlisted')).length,
      averageAIScore: Math.round(
        group.reduce((sum, c) => sum + (c.ai_score ?? 0), 0) / group.length
      ),
    }))
    .sort((a, b) => b.totalCandidates - a.totalCandidates);
}

function computeScoreBuckets(candidates: Candidate[]): ScoreBucket[] {
  const buckets = [
    { label: '90-100', min: 90, max: 100 },
    { label: '80-89', min: 80, max: 89 },
    { label: '70-79', min: 70, max: 79 },
    { label: 'Below 70', min: 0, max: 69 },
  ];

  return buckets.map(({ label, min, max }) => ({
    label,
    count: candidates.filter((c) => (c.ai_score ?? 0) >= min && (c.ai_score ?? 0) <= max).length,
  }));
}

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/candidates');
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error ?? 'Failed to load candidates.');
      }

      const candidates: Candidate[] = body;

      setData({
        candidates,
        kpis: computeKPIs(candidates),
        collegeGroups: computeCollegeGroups(candidates),
        scoreBuckets: computeScoreBuckets(candidates),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}
