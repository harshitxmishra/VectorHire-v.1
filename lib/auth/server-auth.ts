import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthContext {
  id: string;
  email: string;
  role: string;
  isDemo: boolean;
}

export interface AuthValidationResult {
  authorized: boolean;
  user: AuthContext | null;
  response?: NextResponse;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const match =
    cookieHeader.match(/sb-[a-zA-Z0-9]+-auth-token=([^;]+)/) ||
    cookieHeader.match(/sb-access-token=([^;]+)/);

  if (match?.[1]) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith('[') || decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        return Array.isArray(parsed) ? parsed[0] : parsed.access_token || parsed;
      }
      return decoded;
    } catch {
      return match[1];
    }
  }

  return null;
}

/**
 * Server-side authentication and authorization verifier.
 *
 * Security Model:
 * 1. Cryptographic Supabase Auth Token verification:
 *    - Extracts Bearer token or Supabase cookie.
 *    - Calls auth.getUser(token) with anon key (NOT service role key).
 *    - Role is derived strictly from server-verified user metadata.
 *
 * 2. Controlled Local Development / Demo Fallback:
 *    - In production (NODE_ENV === 'production'), only cryptographically valid
 *      Supabase sessions are accepted. Untrusted client role assertions are rejected.
 *    - In local dev mode without Supabase Auth keys configured, provides a controlled,
 *      fixed development session without trusting client-supplied role parameters.
 */
export async function verifyServerAuth(req: Request): Promise<AuthValidationResult> {
  const token = extractToken(req);

  // 1. Primary: Validate Supabase Auth session token
  if (token && supabaseUrl && supabaseAnonKey) {
    try {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const {
        data: { user },
        error,
      } = await authClient.auth.getUser(token);

      if (user && !error) {
        const meta = user.user_metadata || {};
        return {
          authorized: true,
          user: {
            id: user.id,
            email: user.email || 'user@vectorhire.ai',
            role: typeof meta.role === 'string' ? meta.role : 'Recruiter Admin',
            isDemo: false,
          },
        };
      }
    } catch {
      // Auth verification error -> fall through to reject or dev fallback
    }
  }

  // 2. Production Security Enforcement:
  // In production, unverified requests MUST be rejected (never trust client headers).
  if (process.env.NODE_ENV === 'production') {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required. Valid session token missing or expired.' },
        { status: 401 }
      ),
    };
  }

  // 3. Local Development Mode Only:
  // In dev environments without active Supabase Auth credentials, allow the local
  // recruiter workspace with a fixed server-assigned identity.
  const isLocalDev = process.env.NODE_ENV === 'development' || !supabaseUrl || !supabaseAnonKey;
  if (isLocalDev) {
    return {
      authorized: true,
      user: {
        id: 'dev-admin-01',
        email: 'admin@vectorhire.ai',
        role: 'Admin Workspace',
        isDemo: true,
      },
    };
  }

  return {
    authorized: false,
    user: null,
    response: NextResponse.json(
      { error: 'Authentication required. Please sign in.' },
      { status: 401 }
    ),
  };
}

/**
 * Defense-in-depth safeguard against accidental triggers of destructive operations.
 * NOTE: This is NOT an authentication or authorization mechanism.
 */
export function requireDestructiveConfirmation(req: Request): {
  confirmed: boolean;
  response?: NextResponse;
} {
  const confirmed = req.headers.get('x-confirm-destructive') === 'true';
  if (!confirmed) {
    return {
      confirmed: false,
      response: NextResponse.json(
        {
          error:
            "Confirmation header 'x-confirm-destructive: true' is required for destructive candidate operations.",
        },
        { status: 400 }
      ),
    };
  }
  return { confirmed: true };
}
