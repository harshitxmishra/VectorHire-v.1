import { describe, it, expect } from 'vitest';
import { extractDriveFileId, toDirectDownloadUrl } from './google-drive';

describe('extractDriveFileId', () => {
  it('extracts the id from a /file/d/ share link', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/ABC123/view?usp=sharing')).toBe('ABC123');
  });

  it('extracts the id from an ?id= query param link', () => {
    expect(extractDriveFileId('https://drive.google.com/open?id=XYZ789')).toBe('XYZ789');
  });

  it('returns null for a non-Drive url', () => {
    expect(extractDriveFileId('https://example.com/resume.pdf')).toBeNull();
  });
});

describe('toDirectDownloadUrl', () => {
  it('converts a share link into a direct-download url', () => {
    expect(toDirectDownloadUrl('https://drive.google.com/file/d/ABC123/view')).toBe(
      'https://drive.google.com/uc?export=download&id=ABC123'
    );
  });

  it('falls back to the original url when no id is found', () => {
    const url = 'https://example.com/resume.pdf';
    expect(toDirectDownloadUrl(url)).toBe(url);
  });
});
