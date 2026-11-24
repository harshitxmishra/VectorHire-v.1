import { describe, it, expect } from 'vitest';
import { runHiringCommittee } from '@/lib/services/hiring-committee';
import { computeContentHash } from '@/lib/services/cache-service';
import { DebateTurn, CommitteeVerdict } from '@/lib/types';

describe('Phase 2: Adversarial 3-Agent Hiring Committee Debate Pattern', () => {
  const sampleCandidateInput = {
    candidate_id: 902,
    full_name: 'Elena Rostova',
    college: 'Carnegie Mellon',
    cgpa: 3.9,
    github: 'https://github.com/elena-rostova/distributed-raft',
    resume_text: 'Led development of distributed Raft consensus library in TypeScript. Built resilient Redis BullMQ workers with exponential backoff.',
    best_ai_project: 'Autonomous Log Anomaly Classifier with vector embeddings',
    job_description: {
      title: 'Staff Backend Engineer (Distributed Systems)',
      requirements: 'Deep experience in TypeScript, Redis, distributed consensus algorithms, and test-driven development.',
    },
    force: true,
  };

  it('orchestrates 3 distinct debate turns: ADVOCATE, SKEPTIC, and HIRING_MANAGER', async () => {
    const recordedTurns: DebateTurn[] = [];
    const result = await runHiringCommittee({
      ...sampleCandidateInput,
      onTurn: (turn) => recordedTurns.push(turn),
    });

    expect(result).toBeDefined();
    expect(result.debate_transcript.length).toBeGreaterThanOrEqual(3);

    const agentsInTranscript = result.debate_transcript.map((t) => t.agent);
    expect(agentsInTranscript).toContain('ADVOCATE');
    expect(agentsInTranscript).toContain('SKEPTIC');
    expect(agentsInTranscript).toContain('HIRING_MANAGER');
  });

  it('Advocate agent builds strong pro-hire case highlighting engineering depth and code evidence', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);
    const advocateTurn = result.debate_transcript.find((t) => t.agent === 'ADVOCATE');

    expect(advocateTurn).toBeDefined();
    expect(advocateTurn?.claim.length).toBeGreaterThan(20);
    expect(advocateTurn?.evidence_citations.length).toBeGreaterThan(0);
    expect(advocateTurn?.timestamp).toBeDefined();
  });

  it('Skeptic agent cross-examines claims and inspects edge cases, tests, or shallow abstractions', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);
    const skepticTurn = result.debate_transcript.find((t) => t.agent === 'SKEPTIC');

    expect(skepticTurn).toBeDefined();
    expect(skepticTurn?.claim.length).toBeGreaterThan(20);
    expect(skepticTurn?.evidence_citations.length).toBeGreaterThan(0);
  });

  it('Hiring Manager synthesizes opposing views against the JD rubric into a calibrated verdict', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);
    const validVerdicts: CommitteeVerdict[] = ['STRONG_HIRE', 'LEAN_HIRE', 'LEAN_NO_HIRE', 'NO_HIRE'];

    expect(validVerdicts).toContain(result.verdict);
    expect(typeof result.calibrated_score).toBe('number');
    expect(result.calibrated_score).toBeGreaterThanOrEqual(0);
    expect(result.calibrated_score).toBeLessThanOrEqual(100);
  });

  it('verdict accurately aligns with the calibrated score boundary thresholds', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);

    if (result.calibrated_score >= 85) {
      expect(result.verdict).toBe('STRONG_HIRE');
    } else if (result.calibrated_score >= 70) {
      expect(result.verdict).toBe('LEAN_HIRE');
    } else if (result.calibrated_score >= 55) {
      expect(result.verdict).toBe('LEAN_NO_HIRE');
    } else {
      expect(result.verdict).toBe('NO_HIRE');
    }
  });

  it('constructs a claim verification matrix categorizing skills with verifiable citations', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);

    expect(result.claim_verification_matrix).toBeDefined();
    expect(result.claim_verification_matrix.length).toBeGreaterThan(0);

    const validStatuses = ['VERIFIED_IN_CODE', 'RESUME_ONLY', 'CONTRADICTED', 'MISSING'];
    for (const item of result.claim_verification_matrix) {
      expect(item.skill).toBeDefined();
      expect(validStatuses).toContain(item.status);
      expect(item.citation).toBeDefined();
    }
  });

  it('includes inspected code files and line-specific questions in the committee result', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);

    expect(result.inspected_files).toBeDefined();
    expect(result.inspected_files.length).toBeGreaterThanOrEqual(1);
    expect(result.line_specific_interview_questions).toBeDefined();
    expect(result.line_specific_interview_questions.length).toBeGreaterThanOrEqual(1);
  });

  it('computes stable SHA-256 content hashes for reproducible caching', () => {
    const hashA = computeContentHash({
      candidateId: 902,
      github: 'https://github.com/elena-rostova/distributed-raft',
      skills: ['TypeScript', 'Redis'],
    });
    const hashB = computeContentHash({
      candidateId: 902,
      github: 'https://github.com/elena-rostova/distributed-raft',
      skills: ['TypeScript', 'Redis'],
    });
    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns cached debate and evaluation result instantly when force is false', async () => {
    // First run with force=true populates cache
    const initial = await runHiringCommittee(sampleCandidateInput);
    expect(initial).toBeDefined();

    // Second run without force should return cached result rapidly
    const cached = await runHiringCommittee({
      ...sampleCandidateInput,
      force: false,
    });
    expect(cached).toBeDefined();
    expect(cached.verdict).toBe(initial.verdict);
    expect(cached.calibrated_score).toBe(initial.calibrated_score);
  });

  it('surfaces high-level summary and recommendation matching the committee outcome', async () => {
    const result = await runHiringCommittee(sampleCandidateInput);

    expect(result.summary).toBeDefined();
    expect(result.recommendation).toBeDefined();
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});
