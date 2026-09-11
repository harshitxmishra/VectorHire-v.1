import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code returned by Google.' }, { status: 400 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google Calendar credentials not configured in server environment.' },
      { status: 500 }
    );
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
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Google Calendar Authorization</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.5; color: #1f2937; background: #f9fafb; }
            .card { max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h2 { color: #b45309; }
            a { color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Notice: Existing Connection Detected</h2>
            <p>Google did not return a new refresh token because this application was previously authorized. If you need to re-issue credentials, revoke access at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>, then try again.</p>
            <p><a href="/settings">Return to Settings</a></p>
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Return a safe sanitized HTML confirmation page without exposing the token
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Google Calendar Connected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.5; color: #1f2937; background: #f9fafb; }
          .card { max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          h2 { color: #047857; }
          a { display: inline-block; margin-top: 16px; background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Google Calendar Connected Successfully</h2>
          <p>Your calendar account has been authenticated for VectorHire interview scheduling and Google Meet link generation.</p>
          <p>You can safely close this window.</p>
          <a href="/settings">Return to Settings</a>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    return NextResponse.json({ error: 'OAuth token exchange failed. Please try again.' }, { status: 500 });
  }
}
