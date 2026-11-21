import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME || 'vectorhire-candidate-documents';

  constructor() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Initialized AWS S3 Client for bucket: ${this.bucketName} (${region})`);
    } else {
      this.logger.log('AWS S3 credentials unset. Operating in local / Supabase fallback storage mode.');
    }
  }

  isConfigured(): boolean {
    return !!(this.s3Client && process.env.AWS_S3_BUCKET_NAME);
  }

  async uploadDocument(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType = 'application/pdf'
  ): Promise<StorageUploadResult> {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);

    // 1. Primary: AWS S3
    if (this.s3Client && process.env.AWS_S3_BUCKET_NAME) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );

        const url = await getSignedUrl(
          this.s3Client,
          new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
          { expiresIn: 3600 }
        );

        return { key, url, provider: 's3' };
      } catch (err) {
        this.logger.warn(`S3 upload failed for ${key}, falling back to storage: ${err}`);
      }
    }

    // 2. Fallback: Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(key, buffer, { contentType, upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(key);
        return { key, url: publicUrlData.publicUrl, provider: 'supabase' };
      }
    } catch (err) {
      this.logger.warn(`Supabase storage fallback error for ${key}: ${err}`);
    }

    // 3. Fallback: Local preview base64 data URI
    const base64 = buffer.toString('base64');
    return {
      key,
      url: `data:${contentType};base64,${base64}`,
      provider: 'local',
    };
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (this.s3Client && process.env.AWS_S3_BUCKET_NAME) {
      try {
        return await getSignedUrl(
          this.s3Client,
          new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
          { expiresIn: expiresInSeconds }
        );
      } catch (err) {
        this.logger.warn(`Failed to generate S3 presigned URL for ${key}: ${err}`);
      }
    }

    // Supabase fallback
    try {
      const { data } = await supabase.storage.from('documents').createSignedUrl(key, expiresInSeconds);
      if (data?.signedUrl) return data.signedUrl;
    } catch {
      // ignore
    }

    return '';
  }

  async deleteDocument(key: string): Promise<void> {
    if (this.s3Client && process.env.AWS_S3_BUCKET_NAME) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucketName, Key: key })
        );
        return;
      } catch (err) {
        this.logger.warn(`Failed to delete S3 object ${key}: ${err}`);
      }
    }

    try {
      await supabase.storage.from('documents').remove([key]);
    } catch {
      // ignore
    }
  }
}
