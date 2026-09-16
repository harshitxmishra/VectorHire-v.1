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
