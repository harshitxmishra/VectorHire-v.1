import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const rawEmail = process.env.DEMO_EMAIL;
  const rawPassword = process.env.DEMO_PASSWORD;
  const demoEmail = rawEmail ? rawEmail.trim().replace(/^["']|["']$/g, '') : '';
  const demoPassword = rawPassword ? rawPassword.trim().replace(/^["']|["']$/g, '') : '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!demoEmail || !demoPassword) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Demo account credentials are not configured on the server. Please sign in with your email and password.',
      },
      { status: 503 }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Supabase configuration missing on server.',
      },
      { status: 500 }
    );
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          ok: false,
          error: error?.message || 'Failed to authenticate with demo credentials.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'An unexpected error occurred during demo authentication.',
      },
      { status: 500 }
    );
  }
}
