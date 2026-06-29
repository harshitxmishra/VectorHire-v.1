import { google } from 'googleapis';
import crypto from 'crypto';

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
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createCalendarEvent(input: {
  candidateName: string;
  interviewerName: string;
  startTime: Date;
  durationMinutes: number;
}): Promise<{ calendarEventId: string | null; meetLink: string | null }> {
  if (!isConfigured()) {
    // Calendar isn't connected yet (no GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN).
    // Visit /api/auth/google to set it up. Scheduling still works without it.
    console.warn('Google Calendar not configured — skipping real event creation.');
    return { calendarEventId: null, meetLink: null };
  }

  const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60_000);

  try {
    const calendar = getCalendarClient();

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Interview: ${input.candidateName} with ${input.interviewerName}`,
        description: `VectorHire interview between ${input.candidateName} and ${input.interviewerName}.`,
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

    return {
      calendarEventId: data.id ?? null,
      meetLink: data.hangoutLink ?? data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    };
  } catch (error) {
    console.error('Google Calendar event creation failed:', error);
    return { calendarEventId: null, meetLink: null };
  }
}

export async function deleteCalendarEvent(calendarEventId: string): Promise<void> {
  if (!isConfigured()) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: 'primary', eventId: calendarEventId });
  } catch (error) {
    console.error('Google Calendar event deletion failed:', error);
  }
}
