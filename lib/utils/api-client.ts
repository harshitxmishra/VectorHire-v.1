import { getSupabaseAuthClient } from '@/lib/supabase/auth-client';

/**
 * Utility for safe API response handling in frontend components.
 * Prevents "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" errors
 * when endpoints return HTML error pages (404, 500, 502, 504).
 */

export interface SafeApiResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
}

/**
 * Retrieves authorization headers carrying the current Supabase session token.
 * Does NOT store tokens manually in localStorage; uses the native Supabase session.
 */
export async function getAuthHeaders(tokenOverride?: string | null): Promise<Record<string, string>> {
  if (tokenOverride) {
    return { Authorization: `Bearer ${tokenOverride}` };
  }

  if (typeof window !== 'undefined') {
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          return { Authorization: `Bearer ${data.session.access_token}` };
        }
      } catch {
        // Fallback without auth header
      }
    }
  }

  return {};
}

/**
 * Wrapper around global fetch that automatically attaches the Supabase JWT Bearer token
 * to authenticated backend requests.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(init?.headers);

  // Set Authorization header if not explicitly provided and token exists
  if (!headers.has('Authorization') && authHeaders.Authorization) {
    headers.set('Authorization', authHeaders.Authorization);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Safely parses a Fetch Response, extracting JSON if present,
 * or producing a descriptive error message if a non-JSON (e.g. HTML 404/500)
 * response was returned by the server.
 */
export async function safeParseApiResponse<T = unknown>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    let body: any;
    try {
      body = await res.json();
    } catch {
      throw new Error(`Failed to parse server response as JSON (HTTP ${res.status}).`);
    }

    if (!res.ok) {
      const errorMsg = body?.error || body?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return body as T;
  }

  // Handle non-JSON response (e.g., HTML 404/500/502/504 error page)
  const rawText = await res.text();
  const sanitizedText = rawText
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/\s+/g, ' ')
    .trim();

  const preview = sanitizedText.slice(0, 150);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`API endpoint not found (HTTP 404). Please verify the requested URL.`);
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(`Service temporarily unavailable (HTTP ${res.status}). Please try again shortly.`);
    }
    throw new Error(
      `Server error (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''})${preview ? `: ${preview}` : ''}`
    );
  }

  throw new Error(`Unexpected non-JSON response format (HTTP ${res.status}).`);
}
