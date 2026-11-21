import { google } from 'googleapis';
import crypto from 'crypto';
import { getAppUrl } from '@/lib/utils/url';

function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? `${getAppUrl()}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Generates a clean, slugified, secure room identifier for fallback meeting links.
 */
export function generateDeterministicMeetingLink(candidateName: string, interviewId?: number | string): string {
  const sanitized = candidateName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 24);
  const hash = crypto.randomBytes(4).toString('hex');
  const idPart = interviewId ? `int${interviewId}-` : '';
  return `https://meet.jit.si/vectorhire-${idPart}${sanitized}-${hash}`;
}

export interface CreateCalendarEventInput {
  candidateName: string;
  candidateEmail?: string;
  interviewerName: string;
  interviewerEmail?: string;
  startTime: Date;
  durationMinutes: number;
  interviewId?: number;
}

export interface CalendarEventResult {
  calendarEventId: string;
  meetLink: string;
  icsDownloadUrl: string;
  icsContent: string;
}

/**
 * Generates RFC 5545 iCalendar (.ics) string.
 */
export function generateIcsInvite(input: {
  eventId: string;
  summary: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  meetLink: string;
  candidateName: string;
  candidateEmail?: string;
  interviewerName: string;
  interviewerEmail?: string;
}): string {
  const {
    eventId,
    summary,
    description,
    startTime,
    durationMinutes,
    meetLink,
    candidateName,
    candidateEmail = 'candidate@vectorhire.ai',
    interviewerName,
    interviewerEmail = 'interviewer@vectorhire.ai',
  } = input;

  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  const formatIcsDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(startTime);
  const dtEnd = formatIcsDate(endTime);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VectorHire//Candidate Interview Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${eventId}@vectorhire.ai`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')} Meeting Link: ${meetLink}`,
    `LOCATION:${meetLink}`,
    `ORGANIZER;CN=${interviewerName}:mailto:${interviewerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${candidateName}:mailto:${candidateEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput
): Promise<CalendarEventResult> {
  const fallbackId = `vh-${crypto.randomUUID()}`;
  let calendarEventId = fallbackId;
  let meetLink: string | null = null;

  if (isConfigured()) {
    try {
      const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60_000);
      const calendar = getCalendarClient();
      const { data } = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Interview: ${input.candidateName} with ${input.interviewerName}`,
          description: `VectorHire technical interview between ${input.candidateName} and ${input.interviewerName}.`,
          start: { dateTime: input.startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });

      if (data.id) calendarEventId = data.id;
      meetLink = data.hangoutLink ?? data.conferenceData?.entryPoints?.[0]?.uri ?? null;
    } catch (error) {
      console.warn('Google Calendar API creation failed, using secure fallback meeting link:', error);
    }
  }

  // Guaranteed valid shareable meeting URL
  if (!meetLink) {
    meetLink = generateDeterministicMeetingLink(input.candidateName, input.interviewId);
  }

  const appUrl = getAppUrl();
  const icsDownloadUrl = input.interviewId
    ? `${appUrl}/api/interviews/${input.interviewId}/calendar.ics`
    : `${appUrl}/api/interviews/calendar.ics?eventId=${calendarEventId}`;

  const icsContent = generateIcsInvite({
    eventId: calendarEventId,
    summary: `Technical Interview: ${input.candidateName} & ${input.interviewerName}`,
    description: `VectorHire technical interview.\nCandidate: ${input.candidateName}\nInterviewer: ${input.interviewerName}\nJoin URL: ${meetLink}`,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    meetLink,
    candidateName: input.candidateName,
    candidateEmail: input.candidateEmail,
    interviewerName: input.interviewerName,
    interviewerEmail: input.interviewerEmail,
  });

  return {
    calendarEventId,
    meetLink,
    icsDownloadUrl,
    icsContent,
  };
}

export async function deleteCalendarEvent(calendarEventId: string): Promise<void> {
  if (!isConfigured() || calendarEventId.startsWith('vh-')) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: 'primary', eventId: calendarEventId });
  } catch (error) {
    console.error('Google Calendar event deletion failed:', error);
  }
}
