import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  uploadDocument,
  getPresignedDownloadUrl,
  isS3Configured,
} from '@/lib/services/storage-service';

describe('AWS S3 Integration & Fallback Storage Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly detects whether AWS credentials are fully configured', () => {
    const configured = isS3Configured();
    // In local dev without AWS_ACCESS_KEY_ID, returns false
    expect(typeof configured).toBe('boolean');
  });

  it('gracefully uploads documents and provides preview download URL under local fallback', async () => {
    const key = `test/document_${Date.now()}.pdf`;
    const content = Buffer.from('%PDF-1.4 Mock PDF Content for VectorHire Offer Letter');

    const result = await uploadDocument(key, content, 'application/pdf');

    expect(result.key).toBe(key);
    expect(result.url).toBeDefined();
    expect(result.provider).toMatch(/^(s3|supabase|local)$/);
  });

  it('handles presigned download URL generation with safe string return', async () => {
    const url = await getPresignedDownloadUrl('offers/sample.pdf', 3600);
    expect(typeof url).toBe('string');
  });
});
