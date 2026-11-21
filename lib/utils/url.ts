/**
 * Resolves the absolute application URL safely across environments:
 * 1. NEXT_PUBLIC_APP_URL (Explicit configuration)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain, e.g. vector-hire-v-1.vercel.app)
 * 3. VERCEL_URL (Vercel deployment preview domain)
 * 4. Fallback to http://localhost:3000
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}
