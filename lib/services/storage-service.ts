import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase/client';

export interface StorageUploadResult {
  key: string;
  url: string;
  provider: 's3' | 'supabase' | 'local';
}

function getS3Client(): S3Client | null {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return null;
}

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  );
}

export async function uploadDocument(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType = 'application/pdf'
): Promise<StorageUploadResult> {
  const s3 = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  // 1. Primary: AWS S3
  if (s3 && bucket) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Buffer.isBuffer(body) ? body : Buffer.from(body),
          ContentType: contentType,
        })
      );

      const downloadUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 3600 }
      );

      return { key, url: downloadUrl, provider: 's3' };
    } catch (err) {
      console.warn('S3 upload failed, attempting fallback storage:', err);
    }
  }

  // 2. Fallback: Supabase Storage
  try {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(key, buffer, { contentType, upsert: true });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(key);
      return { key, url: publicUrlData.publicUrl, provider: 'supabase' };
    }
  } catch (err) {
    console.warn('Supabase storage upload failed:', err);
  }

  // 3. Fallback: In-memory / data URL preview
  const base64 = Buffer.isBuffer(body)
    ? body.toString('base64')
    : Buffer.from(body).toString('base64');
  return {
    key,
    url: `data:${contentType};base64,${base64}`,
    provider: 'local',
  };
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  if (s3 && bucket) {
    try {
      return await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn }
      );
    } catch (err) {
      console.warn('Failed to generate S3 presigned URL:', err);
    }
  }

  // Fallback to Supabase signed URL or public URL
  try {
    const { data } = await supabase.storage.from('documents').createSignedUrl(key, expiresIn);
    if (data?.signedUrl) return data.signedUrl;
  } catch {
    // fallback
  }

  return '';
}

export async function deleteDocument(key: string): Promise<void> {
  const s3 = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  if (s3 && bucket) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    } catch (err) {
      console.warn('Failed to delete S3 object:', err);
    }
  }

  try {
    await supabase.storage.from('documents').remove([key]);
  } catch {
    // Ignore
  }
}
