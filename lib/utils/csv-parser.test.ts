import { describe, it, expect } from 'vitest';
import { mapCandidateRow, mapTestResultRow } from './csv-parser';

describe('mapCandidateRow', () => {
  it('maps a standard recruiter dataset row', () => {
    const row = {
      Name: 'Jane Doe',
      Email: 'jane@example.com',
      College: 'MIT',
      Branch: 'CS',
      CGPA: '8.9',
      'Best AI Project': 'Chatbot',
      'GitHub Profile': 'https://github.com/janedoe',
      'Resume Link': 'https://drive.google.com/file/d/abc/view',
    };

    const mapped = mapCandidateRow(row);
    expect(mapped).not.toBeNull();
    expect(mapped?.full_name).toBe('Jane Doe');
    expect(mapped?.email).toBe('jane@example.com');
    expect(mapped?.cgpa).toBe(8.9);
    expect(mapped?.parsing_status).toBe('pending');
  });

  it('returns null when Name or Email is missing', () => {
    expect(mapCandidateRow({ College: 'MIT' })).toBeNull();
  });

  it('defaults status to Pending and ai_score to 0 when absent', () => {
    const mapped = mapCandidateRow({ Name: 'Bob', Email: 'bob@example.com' });
    expect(mapped?.status).toBe('Pending');
    expect(mapped?.ai_score).toBe(0);
    expect(mapped?.parsing_status).toBe('not_applicable');
  });
});

describe('mapTestResultRow', () => {
  it('maps logical aptitude and coding scores', () => {
    const mapped = mapTestResultRow({
      Email: 'jane@example.com',
      'Logical Aptitude Score': '75',
      'Coding Test Score': '88',
    });
    expect(mapped).toEqual({ email: 'jane@example.com', test_la: 75, test_code: 88 });
  });

  it('returns null when Email is missing', () => {
    expect(mapTestResultRow({ test_la: '50' })).toBeNull();
  });
});
