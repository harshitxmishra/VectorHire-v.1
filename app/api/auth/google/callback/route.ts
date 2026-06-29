import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code returned by Google.' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return new NextResponse(
        `<p>No refresh token returned. Google only issues one the first time you consent. Revoke access at <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a> for this app, then visit <a href="/api/auth/google">/api/auth/google</a> again.</p>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      `<html><body style="font-family: sans-serif; padding: 40px;">
        <h2>Copy this into .env.local as GOOGLE_REFRESH_TOKEN, then delete this token from chat/logs after use:</h2>
        <pre style="background:#eee; padding:16px; word-break:break-all;">${tokens.refresh_token}</pre>
        <p>You can close this tab once copied.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth token exchange failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
