import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const STAGING_DIR = path.join(os.tmpdir(), 'vectorhire_uploads');

function ensureStagingDir(): string {
  if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
  }
  return STAGING_DIR;
}

export function validateUploadId(uploadId: string): void {
  if (!uploadId || !UUID_REGEX.test(uploadId)) {
    throw new Error('Invalid upload ID format');
  }
}

export function resolveStagedFilePath(uploadId: string): string {
  validateUploadId(uploadId);
  const resolvedDir = path.resolve(ensureStagingDir());
  const filePath = path.resolve(resolvedDir, `upload_${uploadId}.csv`);

  // Path traversal guard
  if (!filePath.startsWith(resolvedDir)) {
    throw new Error('Path traversal detected');
  }

  return filePath;
}

/**
 * Stages a dataset buffer into the dedicated temporary directory.
 */
export async function stageDatasetFile(buffer: Buffer, uploadId: string): Promise<string> {
  const filePath = resolveStagedFilePath(uploadId);
  await fs.promises.writeFile(filePath, buffer, { encoding: 'utf8' });
  return filePath;
}

/**
 * Reads staged dataset text from the resolved upload path.
 */
export async function readStagedDataset(uploadId: string): Promise<string> {
  const filePath = resolveStagedFilePath(uploadId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Staged dataset file not found for upload ID ${uploadId}`);
  }
  return fs.promises.readFile(filePath, { encoding: 'utf8' });
}

/**
 * Cleans up (unlinks) a staged dataset file safely.
 */
export async function cleanupStagedFile(uploadId: string): Promise<void> {
  try {
    const filePath = resolveStagedFilePath(uploadId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch {
    // Non-blocking cleanup
  }
}

/**
 * Prunes any orphaned staged files older than 1 hour.
 */
export function pruneStaleStagedFiles(maxAgeMs = 60 * 60 * 1000): void {
  try {
    const dir = ensureStagingDir();
    const files = fs.readdirSync(dir);
    const now = Date.now();

    for (const file of files) {
      if (!file.startsWith('upload_') || !file.endsWith('.csv')) continue;
      const fullPath = path.join(dir, file);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Skip file if unable to stat/unlink
      }
    }
  } catch {
    // Non-blocking directory prune
  }
}
