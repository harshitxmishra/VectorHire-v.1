import { toDirectDownloadUrl } from '@/lib/utils/google-drive';

const ALLOWED_RESUME_HOSTS = [
  'drive.google.com',
  'docs.google.com',
  'storage.googleapis.com',
  'googleusercontent.com',
];

function isPrivateOrRestrictedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata like 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // Multicast / Reserved / Broadcast
  if (a >= 224) return true;

  return false;
}

export function validateSafeResumeUrl(urlString: string): { isValid: boolean; error?: string; parsedUrl?: URL } {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, error: 'Resume URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { isValid: false, error: 'Invalid URL format.' };
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only secure HTTPS resume URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Block localhost, internal domains, and IP formats
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return { isValid: false, error: 'Access to internal or local hostnames is forbidden.' };
  }

  // Block IPv6 loopback and private notation
  if (
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname === '::' ||
    hostname === '[::]' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd')
  ) {
    return { isValid: false, error: 'Access to private IPv6 addresses is forbidden.' };
  }

  // Check IPv4 format (including octal, hex, or standard dotted decimal)
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^0x[0-9a-fA-F]+/i.test(hostname) || /^0[0-7]+/.test(hostname);
  if (isIpv4) {
    if (isPrivateOrRestrictedIPv4(hostname)) {
      return { isValid: false, error: 'Access to private or link-local IP addresses is forbidden.' };
    }
    // For resume fetching, direct IP literals are not permitted
    return { isValid: false, error: 'Direct IP address access is forbidden for resume URLs.' };
  }

  // Host allowlist check: Google Drive, Docs, Google Storage, and Google User Content
  const isAllowedHost = ALLOWED_RESUME_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedHost) {
    return {
      isValid: false,
      error: 'Resume URL host is not supported. Please provide a Google Drive or Google Cloud Storage share link.',
    };
  }

  return { isValid: true, parsedUrl: parsed };
}

export interface SafeFetchResult {
  buffer: ArrayBuffer;
  contentType: string;
}

export async function safeFetchResumeBuffer(
  initialUrl: string,
  maxRedirects = 3
): Promise<SafeFetchResult> {
  const directUrl = toDirectDownloadUrl(initialUrl);
  let currentUrl = directUrl;
  let redirectsRemaining = maxRedirects;

  while (true) {
    const validation = validateSafeResumeUrl(currentUrl);
    if (!validation.isValid) {
      throw new Error(`SSRF Validation Failed: ${validation.error}`);
    }

    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'VectorHire-ResumeFetcher/1.0',
      },
    });

    // Check for redirects (301, 302, 303, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header.');
      }

      if (redirectsRemaining <= 0) {
        throw new Error('Too many redirects while downloading resume file.');
      }

      redirectsRemaining--;
      // Resolve relative redirect paths against current URL
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed to download resume file (HTTP ${response.status}).`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      throw new Error(
        'Google Drive returned a webpage instead of a file. Please ensure the link is shared as "Anyone with the link can view".'
      );
    }

    const buffer = await response.arrayBuffer();
    return { buffer, contentType };
  }
}
