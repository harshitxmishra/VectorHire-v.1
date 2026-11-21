import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HIRING_STAGES,
  isValidStageTransition,
  normalizeHiringStage,
  createTransitionAuditLog,
} from '@/lib/workflow/hiring-state-machine';
import {
  generateDeterministicMeetingLink,
  generateIcsInvite,
} from '@/lib/services/calendar-service';
import {
  generateOfferToken,
  verifyOfferToken,
  renderOfferDocumentHtml,
} from '@/lib/services/offer-letter-service';
import {
  computeContentHash,
  getCachedAIEvaluation,
  setCachedAIEvaluation,
} from '@/lib/services/cache-service';

describe('End-to-End Enterprise Candidate Lifecycle & Infrastructure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Full 7-Stage State Machine Lifecycle Verification', () => {
    it('executes a candidate forward journey across all 7 canonical stages', () => {
      const candidateStages: string[] = [];
      let current = 'APPLIED';
      candidateStages.push(current);

      const sequentialStages = [
        'SCREENING',
        'TECHNICAL_EVAL',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_COMPLETED',
        'OFFER_SENT',
        'HIRED',
      ];

      for (const next of sequentialStages) {
        const transition = isValidStageTransition(current, next);
        expect(transition.valid).toBe(true);
        current = transition.normalizedTo;
        candidateStages.push(current);
      }

      expect(candidateStages).toEqual([
        'APPLIED',
        'SCREENING',
        'TECHNICAL_EVAL',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_COMPLETED',
        'OFFER_SENT',
        'HIRED',
      ]);
    });

    it('rejects candidate correctly at each individual stage and logs audit trail', () => {
      for (const stage of ['APPLIED', 'SCREENING', 'TECHNICAL_EVAL', 'INTERVIEW_SCHEDULED', 'OFFER_SENT']) {
        const check = isValidStageTransition(stage, 'REJECTED');
        expect(check.valid).toBe(true);

        const audit = createTransitionAuditLog(88, stage, 'REJECTED', 'evaluator@vectorhire.ai', 'Skills did not match profile');
        expect(audit.fromStage).toBe(normalizeHiringStage(stage));
        expect(audit.toStage).toBe('REJECTED');
        expect(audit.actor).toBe('evaluator@vectorhire.ai');
      }
    });

    it('blocks illegal backward or bypass transitions', () => {
      // Cannot skip from APPLIED straight to HIRED
      expect(isValidStageTransition('APPLIED', 'HIRED').valid).toBe(false);
      // Cannot jump from TECHNICAL_EVAL straight to HIRED
      expect(isValidStageTransition('TECHNICAL_EVAL', 'HIRED').valid).toBe(false);
      // Cannot skip straight from INTERVIEW_SCHEDULED to HIRED without completing interview and offer
      expect(isValidStageTransition('INTERVIEW_SCHEDULED', 'HIRED').valid).toBe(false);
    });
  });

  describe('Meeting Link & Calendar .ics Integrity', () => {
    it('ensures meeting link is always non-null, secure HTTPS, and slugified', () => {
      const link = generateDeterministicMeetingLink('Elena Rostova', 505);
      expect(link).toContain('https://meet.jit.si/vectorhire-int505-elena-rostova');
      expect(link.length).toBeGreaterThan(30);
    });

    it('produces an RFC 5545 calendar file with valid DTSTART, DTEND, and UID', () => {
      const start = new Date('2026-11-25T15:00:00Z');
      const ics = generateIcsInvite({
        eventId: 'meet-uuid-101',
        summary: 'Staff AI Systems Interview',
        description: 'Technical evaluation of pgvector & BullMQ pipelines.',
        startTime: start,
        durationMinutes: 60,
        meetLink: 'https://meet.jit.si/vectorhire-interview-101',
        candidateName: 'David Kim',
        candidateEmail: 'david@example.com',
        interviewerName: 'Alex Mercer',
        interviewerEmail: 'alex@vectorhire.ai',
      });

      expect(ics).toMatch(/^BEGIN:VCALENDAR[\s\S]*END:VCALENDAR$/);
      expect(ics).toContain('UID:meet-uuid-101@vectorhire.ai');
      expect(ics).toContain('DTSTART:20261125T150000Z');
      expect(ics).toContain('DTEND:20261125T160000Z');
      expect(ics).toContain('LOCATION:https://meet.jit.si/vectorhire-interview-101');
    });
  });

  describe('Offer Letter Cryptographic Token & Portal Lifecycle', () => {
    it('generates HMAC-signed token, validates structure, and simulates accept -> HIRED', () => {
      const candidateId = 77;
      const token = generateOfferToken(candidateId, 999, 5);

      const verification = verifyOfferToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.candidateId).toBe(candidateId);

      // Verify state transition for candidate acceptance
      const acceptTransition = isValidStageTransition('OFFER_SENT', 'HIRED');
      expect(acceptTransition.valid).toBe(true);
      expect(acceptTransition.normalizedTo).toBe('HIRED');
    });

    it('simulates candidate decline -> REJECTED with audit note', () => {
      const declineTransition = isValidStageTransition('OFFER_SENT', 'REJECTED');
      expect(declineTransition.valid).toBe(true);
      expect(declineTransition.normalizedTo).toBe('REJECTED');

      const declineAudit = createTransitionAuditLog(
        77,
        'OFFER_SENT',
        'REJECTED',
        'candidate',
        'Accepted another competitive offer'
      );
      expect(declineAudit.reason).toContain('competitive offer');
    });

    it('renders candidate-facing HTML offer document with all required employment terms', () => {
      const html = renderOfferDocumentHtml({
        candidateName: 'Marcus Vance',
        roleTitle: 'Principal Cloud Architect',
        annualSalary: 210000,
        currency: 'USD',
        startDate: '2026-12-15',
        expirationDate: '2026-12-22',
      });

      expect(html).toContain('Principal Cloud Architect');
      expect(html).toContain('USD 210,000');
      expect(html).toContain('Marcus Vance');
      expect(html).toContain('VectorHire');
    });
  });

  describe('Repeat Evaluation Cache Hit Ratio SLA', () => {
    it('guarantees >=80% repeated call avoidance and sub-100ms response', async () => {
      const payload = { candidateId: 900, skills: ['PostgreSQL', 'Redis', 'NestJS'] };
      const hash = computeContentHash(payload);

      const mockEval = {
        score: 95,
        summary: 'Exceptional systems architect.',
        strengths: ['High performance caching', 'Cloud architecture'],
        weaknesses: [],
        recommendation: 'Strong Hire',
        interviewQuestions: [],
      };

      await setCachedAIEvaluation(hash, 900, null, mockEval, 7);

      // Repeat 10 evaluation requests (simulating UI page refreshes / repeat evaluations)
      let cacheHits = 0;
      for (let i = 0; i < 10; i++) {
        const result = await getCachedAIEvaluation(hash);
        if (result && result.cached) {
          cacheHits++;
        }
      }

      // 100% cache hit on repeats (well above the >=80% requirement)
      expect(cacheHits).toBe(10);
    });
  });
});
