import { describe, it, expect } from 'vitest';
import { validateSafeResumeUrl } from './ssrf-protection';

describe('validateSafeResumeUrl', () => {
  it('allows valid Google Drive URL formats', () => {
    const validUrls = [
      'https://drive.google.com/file/d/1A2B3C4D5E/view',
      'https://drive.google.com/open?id=1A2B3C4D5E',
      'https://docs.google.com/document/d/1A2B3C4D5E/export?format=pdf',
      'https://storage.googleapis.com/vectorhire-resumes/sample.pdf',
    ];

    for (const url of validUrls) {
      const result = validateSafeResumeUrl(url);
      expect(result.isValid).toBe(true);
    }
  });

  it('rejects non-HTTPS protocols', () => {
    const httpUrl = 'http://drive.google.com/file/d/123/view';
    const ftpUrl = 'ftp://drive.google.com/file/d/123/view';
    const fileUrl = 'file:///etc/passwd';

    expect(validateSafeResumeUrl(httpUrl).isValid).toBe(false);
    expect(validateSafeResumeUrl(ftpUrl).isValid).toBe(false);
    expect(validateSafeResumeUrl(fileUrl).isValid).toBe(false);
  });

  it('blocks loopback and localhost destinations', () => {
    const blocked = [
      'https://localhost/secret.pdf',
      'https://localhost:8080/file.pdf',
      'https://127.0.0.1/admin',
      'https://127.0.0.1:3000/api',
      'https://[::1]/secret',
    ];

    for (const url of blocked) {
      const result = validateSafeResumeUrl(url);
      expect(result.isValid).toBe(false);
    }
  });

  it('blocks private IPv4 ranges and cloud metadata endpoints', () => {
    const blocked = [
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.1/internal.pdf',
      'https://192.168.1.1/router.pdf',
      'https://172.16.0.5/private.pdf',
      'https://0.0.0.0/',
    ];

    for (const url of blocked) {
      const result = validateSafeResumeUrl(url);
      expect(result.isValid).toBe(false);
    }
  });

  it('blocks untrusted third-party hosts', () => {
    const untrusted = [
      'https://evil-attacker.com/malicious.pdf',
      'https://pastebin.com/raw/test',
      'https://webhook.site/1234',
    ];

    for (const url of untrusted) {
      const result = validateSafeResumeUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
    }
  });
});
