import { Candidate, JobMatchResult } from '@/lib/types';

export function compositeScore(
  candidate: Candidate,
  matches: Record<number, JobMatchResult>
): number {
  const parts: number[] = [];
  if (typeof candidate.ai_score === 'number') parts.push(candidate.ai_score);
  if (typeof candidate.github_score === 'number') parts.push(candidate.github_score);
  if (matches[candidate.id]) parts.push(matches[candidate.id].match_percentage);
  if (typeof candidate.test_la === 'number' && typeof candidate.test_code === 'number') {
    parts.push((candidate.test_la + candidate.test_code) / 2);
  }
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
}
