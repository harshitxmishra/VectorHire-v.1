import { describe, it, expect } from 'vitest';
import {
  HIRING_STAGES,
  ALLOWED_TRANSITIONS,
  STAGE_DISPLAY_NAMES,
  normalizeHiringStage,
  isValidStageTransition,
  createTransitionAuditLog,
} from '@/lib/workflow/hiring-state-machine';

describe('7-Stage Hiring Workflow State Machine', () => {
  it('defines the canonical 7 stages plus terminal states', () => {
    expect(HIRING_STAGES).toEqual([
      'APPLIED',
      'SCREENING',
      'TECHNICAL_EVAL',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'OFFER_SENT',
      'HIRED',
      'REJECTED',
    ]);
  });

  describe('Stage Normalization', () => {
    it('normalizes uppercase, lowercase, and title-case stage names', () => {
      expect(normalizeHiringStage('applied')).toBe('APPLIED');
      expect(normalizeHiringStage('Applied')).toBe('APPLIED');
      expect(normalizeHiringStage('SCREENING')).toBe('SCREENING');
      expect(normalizeHiringStage('technical_eval')).toBe('TECHNICAL_EVAL');
    });

    it('normalizes legacy ATS stage aliases smoothly', () => {
      expect(normalizeHiringStage('Reviewing')).toBe('SCREENING');
      expect(normalizeHiringStage('Shortlisted')).toBe('SCREENING');
      expect(normalizeHiringStage('Assessment Sent')).toBe('TECHNICAL_EVAL');
      expect(normalizeHiringStage('Assessment Completed')).toBe('TECHNICAL_EVAL');
      expect(normalizeHiringStage('Interview Eligible')).toBe('TECHNICAL_EVAL');
      expect(normalizeHiringStage('Offer Extended')).toBe('OFFER_SENT');
      expect(normalizeHiringStage('Hired')).toBe('HIRED');
      expect(normalizeHiringStage('Rejected')).toBe('REJECTED');
    });

    it('defaults undefined or empty input to APPLIED', () => {
      expect(normalizeHiringStage(null)).toBe('APPLIED');
      expect(normalizeHiringStage(undefined)).toBe('APPLIED');
      expect(normalizeHiringStage('')).toBe('APPLIED');
    });
  });

  describe('Strict Transition Validation', () => {
    it('allows valid sequential pipeline transitions', () => {
      expect(isValidStageTransition('APPLIED', 'SCREENING').valid).toBe(true);
      expect(isValidStageTransition('SCREENING', 'TECHNICAL_EVAL').valid).toBe(true);
      expect(isValidStageTransition('TECHNICAL_EVAL', 'INTERVIEW_SCHEDULED').valid).toBe(true);
      expect(isValidStageTransition('INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED').valid).toBe(true);
      expect(isValidStageTransition('INTERVIEW_COMPLETED', 'OFFER_SENT').valid).toBe(true);
      expect(isValidStageTransition('OFFER_SENT', 'HIRED').valid).toBe(true);
    });

    it('allows transitions to REJECTED from any active pipeline stage', () => {
      expect(isValidStageTransition('APPLIED', 'REJECTED').valid).toBe(true);
      expect(isValidStageTransition('SCREENING', 'REJECTED').valid).toBe(true);
      expect(isValidStageTransition('TECHNICAL_EVAL', 'REJECTED').valid).toBe(true);
      expect(isValidStageTransition('INTERVIEW_SCHEDULED', 'REJECTED').valid).toBe(true);
      expect(isValidStageTransition('INTERVIEW_COMPLETED', 'REJECTED').valid).toBe(true);
      expect(isValidStageTransition('OFFER_SENT', 'REJECTED').valid).toBe(true);
    });

    it('blocks illegal forward stage skips', () => {
      // Cannot skip directly from APPLIED to OFFER_SENT
      const check1 = isValidStageTransition('APPLIED', 'OFFER_SENT');
      expect(check1.valid).toBe(false);
      expect(check1.error).toContain('Invalid transition');

      // Cannot jump from SCREENING directly to HIRED
      const check2 = isValidStageTransition('SCREENING', 'HIRED');
      expect(check2.valid).toBe(false);
      expect(check2.error).toContain('Invalid transition');

      // Cannot jump from TECHNICAL_EVAL directly to HIRED
      const check3 = isValidStageTransition('TECHNICAL_EVAL', 'HIRED');
      expect(check3.valid).toBe(false);
    });

    it('permits idempotent identical state transitions', () => {
      expect(isValidStageTransition('APPLIED', 'APPLIED').valid).toBe(true);
      expect(isValidStageTransition('HIRED', 'HIRED').valid).toBe(true);
      expect(isValidStageTransition('SCREENING', 'SCREENING').valid).toBe(true);
    });

    it('permits reopening REJECTED candidates to APPLIED or SCREENING with audit', () => {
      expect(isValidStageTransition('REJECTED', 'APPLIED').valid).toBe(true);
      expect(isValidStageTransition('REJECTED', 'SCREENING').valid).toBe(true);
      // But not directly to HIRED without going through pipeline
      expect(isValidStageTransition('REJECTED', 'HIRED').valid).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('creates structured audit log entries for stage transitions', () => {
      const log = createTransitionAuditLog(
        42,
        'APPLIED',
        'SCREENING',
        'recruiter@vectorhire.ai',
        'Candidate passed resume screening',
        { score: 88 }
      );

      expect(log.candidateId).toBe(42);
      expect(log.fromStage).toBe('APPLIED');
      expect(log.toStage).toBe('SCREENING');
      expect(log.actor).toBe('recruiter@vectorhire.ai');
      expect(log.reason).toBe('Candidate passed resume screening');
      expect(log.metadata).toEqual({ score: 88 });
      expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
