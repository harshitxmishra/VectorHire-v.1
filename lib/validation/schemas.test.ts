import { describe, it, expect } from 'vitest';
import {
  validateCandidateStatus,
  validateJobDescriptionInput,
  validateInterviewInput,
  validateInterviewStatus,
  validateEmailSendInput,
  validateGitHubUrlInput,
} from './schemas';

describe('validateCandidateStatus', () => {
  it('accepts canonical pipeline stages in any case', () => {
    expect(validateCandidateStatus('Applied').success).toBe(true);
    expect(validateCandidateStatus('shortlisted').success).toBe(true);
    expect(validateCandidateStatus('INTERVIEW SCHEDULED').success).toBe(true);
    expect(validateCandidateStatus('hired').success).toBe(true);
  });

  it('accepts ingestion and legacy statuses', () => {
    expect(validateCandidateStatus('Pending').success).toBe(true);
    expect(validateCandidateStatus('New').success).toBe(true);
    expect(validateCandidateStatus('Reviewed').success).toBe(true);
  });

  it('rejects invalid or arbitrary strings', () => {
    const res = validateCandidateStatus('invalid_status_xyz');
    expect(res.success).toBe(false);
  });
});

describe('validateJobDescriptionInput', () => {
  it('validates correct job description input', () => {
    const res = validateJobDescriptionInput({
      title: 'Senior Full Stack Engineer',
      requirements: 'TypeScript, React, Node.js',
    });
    expect(res.success).toBe(true);
  });

  it('rejects missing or empty title', () => {
    const res = validateJobDescriptionInput({ title: '', requirements: 'Valid reqs' });
    expect(res.success).toBe(false);
  });
});

describe('validateInterviewInput', () => {
  it('validates valid interview input', () => {
    const res = validateInterviewInput({
      candidate_id: 42,
      interviewer_name: 'Lead Recruiter',
      scheduled_date: new Date().toISOString(),
      duration_minutes: 45,
    });
    expect(res.success).toBe(true);
  });

  it('rejects non-positive candidate_id', () => {
    const res = validateInterviewInput({
      candidate_id: -5,
      interviewer_name: 'Lead Recruiter',
      scheduled_date: new Date().toISOString(),
    });
    expect(res.success).toBe(false);
  });
});

describe('validateInterviewStatus', () => {
  it('accepts completed or cancelled', () => {
    expect(validateInterviewStatus('completed').success).toBe(true);
    expect(validateInterviewStatus('cancelled').success).toBe(true);
  });

  it('rejects other strings', () => {
    expect(validateInterviewStatus('in-progress').success).toBe(false);
  });
});

describe('validateEmailSendInput', () => {
  it('validates email send input', () => {
    const res = validateEmailSendInput({
      candidateIds: [1, 2, 3],
      type: 'assessment',
    });
    expect(res.success).toBe(true);
  });

  it('rejects empty candidateIds array', () => {
    const res = validateEmailSendInput({
      candidateIds: [],
      type: 'assessment',
    });
    expect(res.success).toBe(false);
  });
});
