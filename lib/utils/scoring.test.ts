import { describe, it, expect } from 'vitest';
import { compositeScore } from './scoring';
import { Candidate } from '@/lib/types';

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 1,
    created_at: '',
    full_name: 'Test',
    email: 't@test.com',
    college: 'Test U',
    cgpa: 8,
    github: null,
    status: 'Pending',
    ai_score: 80,
    branch: null,
    best_ai_project: null,
    research_work: null,
    resume_url: null,
    resume_text: null,
    parsing_status: 'not_applicable',
    parsed_at: null,
    test_la: null,
    test_code: null,
    dataset_id: null,
    github_score: null,
    github_summary: null,
    github_languages: [],
    github_portfolio_verdict: null,
    github_highlights: [],
    github_strongest_repo: null,
    github_last_analyzed: null,
    ai_evaluation: null,
    ai_evaluated_at: null,
    ...overrides,
  };
}

describe('compositeScore', () => {
  it('uses only ai_score when nothing else is available', () => {
    expect(compositeScore(makeCandidate({ ai_score: 80 }), {})).toBe(80);
  });

  it('averages ai_score and github_score when both present', () => {
    expect(compositeScore(makeCandidate({ ai_score: 80, github_score: 60 }), {})).toBe(70);
  });

  it('includes JD match percentage when available', () => {
    const candidate = makeCandidate({ ai_score: 90 });
    const matches = { 1: { match_percentage: 70 } as any };
    expect(compositeScore(candidate, matches)).toBe(80);
  });

  it('averages test_la and test_code as a single component', () => {
    const candidate = makeCandidate({ ai_score: 100, test_la: 50, test_code: 50 });
    expect(compositeScore(candidate, {})).toBe(75);
  });

  it('returns 0 when ai_score is not a number and nothing else is available', () => {
    const candidate = makeCandidate({ ai_score: null as unknown as number });
    expect(compositeScore(candidate, {})).toBe(0);
  });
});
