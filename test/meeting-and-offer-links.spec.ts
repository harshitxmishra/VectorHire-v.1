import { describe, it, expect } from 'vitest';
import {
  generateDeterministicMeetingLink,
  generateIcsInvite,
} from '@/lib/services/calendar-service';
import {
  generateOfferToken,
  verifyOfferToken,
  renderOfferDocumentHtml,
} from '@/lib/services/offer-letter-service';

describe('Meeting Links & Calendar RFC 5545 Generation', () => {
  it('generates secure, deterministic, non-empty meeting URLs', () => {
    const link1 = generateDeterministicMeetingLink('Sarah Chen', 101);
    expect(link1).toMatch(/^https:\/\/meet\.jit\.si\/vectorhire-int101-sarah-chen-[a-f0-9]{8}$/);

    const link2 = generateDeterministicMeetingLink('Alex O\'Connor & Friends', 102);
    expect(link2).toContain('https://meet.jit.si/vectorhire-int102-alex-o-connor');
    expect(link2.startsWith('https://')).toBe(true);
  });

  it('generates valid RFC 5545 compliant .ics calendar content', () => {
    const startTime = new Date('2026-12-01T14:00:00Z');
    const ics = generateIcsInvite({
      eventId: 'interview-event-999',
      summary: 'Senior Backend Engineer Interview',
      description: 'System design and architecture discussion.',
      startTime,
      durationMinutes: 45,
      meetLink: 'https://meet.jit.si/vectorhire-int999-candidate',
      candidateName: 'John Doe',
      candidateEmail: 'john@example.com',
      interviewerName: 'Jane Smith',
      interviewerEmail: 'jane@vectorhire.ai',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//VectorHire//Candidate Interview Schedule//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:interview-event-999@vectorhire.ai');
    expect(ics).toContain('SUMMARY:Senior Backend Engineer Interview');
    expect(ics).toContain('LOCATION:https://meet.jit.si/vectorhire-int999-candidate');
    expect(ics).toContain('ORGANIZER;CN=Jane Smith:mailto:jane@vectorhire.ai');
    expect(ics).toContain('ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=John Doe:mailto:john@example.com');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});

describe('Cryptographically Signed Offer Letter Links', () => {
  it('generates a valid signed token that verifies successfully', () => {
    const token = generateOfferToken(123, 456, 7);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(2);

    const verified = verifyOfferToken(token);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.candidateId).toBe(123);
    expect(verified.payload?.offerId).toBe(456);
    expect(verified.expired).toBeFalsy();
  });

  it('detects tampering or corruption in the token payload or signature', () => {
    const validToken = generateOfferToken(123, 456, 7);
    const [payload, sig] = validToken.split('.');

    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({ candidateId: 999 })).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${sig}`;

    const result = verifyOfferToken(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid token signature');
  });

  it('detects expired offer tokens', () => {
    // Generate token expired in the past (-1 day)
    const expiredToken = generateOfferToken(123, 456, -1);
    const verified = verifyOfferToken(expiredToken);

    expect(verified.valid).toBe(false);
    expect(verified.expired).toBe(true);
    expect(verified.error).toContain('expired');
  });

  it('renders complete HTML offer letter with proper candidate data', () => {
    const html = renderOfferDocumentHtml({
      candidateName: 'Jane Dev',
      roleTitle: 'Staff AI Engineer',
      annualSalary: 185000,
      currency: 'USD',
      startDate: '2026-11-01',
      expirationDate: '2026-11-08',
    });

    expect(html).toContain('Formal Offer of Employment');
    expect(html).toContain('Jane Dev');
    expect(html).toContain('Staff AI Engineer');
    expect(html).toContain('185,000');
    expect(html).toContain('VectorHire');
  });
});
