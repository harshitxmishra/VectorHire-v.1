import { describe, it, expect } from 'vitest';
import {
  PREVIEW_METRICS,
  PREVIEW_CANDIDATES,
  PREVIEW_ACTION_ITEMS,
  PREVIEW_AI_EVALUATION,
  PREVIEW_PIPELINE,
  PREVIEW_INTERVIEWS,
  PREVIEW_CAPABILITIES,
} from './preview-data';

describe('Public Preview Isolated Demo Data', () => {
  it('contains static preview metrics with valid numerical and trend fields', () => {
    expect(PREVIEW_METRICS.length).toBeGreaterThanOrEqual(4);
    for (const metric of PREVIEW_METRICS) {
      expect(metric.title).toBeDefined();
      expect(metric.value).toBeDefined();
      expect(metric.change).toBeDefined();
      expect(['up', 'down', 'neutral']).toContain(metric.trend);
    }
  });

  it('contains fictional candidate records with match scores and skill lists', () => {
    expect(PREVIEW_CANDIDATES.length).toBeGreaterThanOrEqual(4);
    for (const candidate of PREVIEW_CANDIDATES) {
      expect(candidate.id).toMatch(/^cand-preview-/);
      expect(candidate.name).toBeDefined();
      expect(candidate.role).toBeDefined();
      expect(candidate.matchScore).toBeGreaterThanOrEqual(70);
      expect(candidate.matchScore).toBeLessThanOrEqual(100);
      expect(candidate.skills.length).toBeGreaterThanOrEqual(3);
      expect(candidate.experience).toBeDefined();
      expect(candidate.highlight).toBeDefined();
    }
  });

  it('contains sample action triage items', () => {
    expect(PREVIEW_ACTION_ITEMS.length).toBeGreaterThanOrEqual(3);
    for (const item of PREVIEW_ACTION_ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.actionText).toBeDefined();
      expect(['high', 'medium']).toContain(item.urgency);
    }
  });

  it('contains complete AI evaluation sample with breakdown categories and rationale', () => {
    expect(PREVIEW_AI_EVALUATION.candidateName).toBe('Sarah Chen');
    expect(PREVIEW_AI_EVALUATION.overallScore).toBe(96);
    expect(PREVIEW_AI_EVALUATION.breakdown.length).toBeGreaterThanOrEqual(4);
    for (const item of PREVIEW_AI_EVALUATION.breakdown) {
      expect(item.area).toBeDefined();
      expect(item.score).toBeGreaterThan(0);
      expect(item.level).toBeDefined();
      expect(item.details).toBeDefined();
    }
    expect(PREVIEW_AI_EVALUATION.summaryRationale).toContain('Sarah demonstrates deep alignment');
    expect(PREVIEW_AI_EVALUATION.recommendation).toBeDefined();
  });

  it('contains pipeline progression stages and interview slots', () => {
    expect(PREVIEW_PIPELINE.length).toBe(5);
    expect(PREVIEW_PIPELINE[0].stage).toBe('Applied');
    expect(PREVIEW_PIPELINE[0].count).toBe(128);

    expect(PREVIEW_INTERVIEWS.length).toBeGreaterThanOrEqual(3);
    for (const interview of PREVIEW_INTERVIEWS) {
      expect(interview.candidateName).toBeDefined();
      expect(interview.time).toBeDefined();
      expect(interview.type).toBeDefined();
    }
  });

  it('contains platform capability highlights', () => {
    expect(PREVIEW_CAPABILITIES.length).toBe(6);
    for (const cap of PREVIEW_CAPABILITIES) {
      expect(cap.title).toBeDefined();
      expect(cap.description).toBeDefined();
      expect(cap.badge).toBeDefined();
    }
  });
});
