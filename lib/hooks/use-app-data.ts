'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Candidate, CollegeGroup, Interview, KPIData, ScoreBucket } from '@/lib/types';

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
    assessmentsPending: 0,
    assessmentsCompleted: 0,
    upcomingInterviews: 0,
    offers: 0,
    hireRate: 0,
    interviewsThisWeek: 0,
  },
  collegeGroups: [],
  scoreBuckets: [],
};

function isStatus(candidate: Candidate, status: string) {
  return candidate.status?.toLowerCase() === status;
}

function computeKPIs(candidates: Candidate[], interviews: Interview[]): KPIData {
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

  const assessmentsPending = candidates.filter((c) => isStatus(c, 'assessment sent')).length;
  const assessmentsCompleted = candidates.filter((c) => isStatus(c, 'assessment completed')).length;
  const offers = candidates.filter((c) => isStatus(c, 'offer extended')).length;
  const hired = candidates.filter((c) => isStatus(c, 'hired')).length;
  const hireRate = totalCandidates ? Math.round((hired / totalCandidates) * 100) : 0;

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const scheduled = interviews.filter((i) => i.status === 'scheduled');
  const upcomingInterviews = scheduled.filter((i) => new Date(i.scheduled_date).getTime() >= now).length;
  const interviewsThisWeek = scheduled.filter((i) => {
    const t = new Date(i.scheduled_date).getTime();
    return t >= now && t <= weekFromNow;
  }).length;

  return {
    totalCandidates,
    shortlisted,
    pendingReview,
    averageAIScore,
    topCollege,
    highScorers,
    assessmentsPending,
    assessmentsCompleted,
    upcomingInterviews,
    offers,
    hireRate,
    interviewsThisWeek,
  };
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
      const [candidatesRes, interviewsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/interviews'),
      ]);
      const body = await candidatesRes.json();
      const interviewsBody = await interviewsRes.json();

      if (!candidatesRes.ok) {
        throw new Error(body?.error ?? 'Failed to load candidates.');
      }

      const candidates: Candidate[] = body;
      const interviews: Interview[] = Array.isArray(interviewsBody) ? interviewsBody : [];

      setData({
        candidates,
        kpis: computeKPIs(candidates, interviews),
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
