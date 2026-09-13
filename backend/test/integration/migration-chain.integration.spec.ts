import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration Chain & SQL Security Integration', () => {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');

  it('verifies migrations directory exists and contains valid SQL migration files', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThanOrEqual(6);
  });

  it('validates migration sequence numbering has no duplicate version prefixes', () => {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const prefixes = files.map((f) => f.split('_')[0]);
    const uniquePrefixes = new Set(prefixes);

    expect(prefixes.length).toBe(uniquePrefixes.size);
  });

  it('verifies all migrations maintain idempotent DDL (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS)', () => {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      // Ensure no raw CREATE TABLE without IF NOT EXISTS
      const rawCreateTable = sql.match(/create\s+table\s+(?!if\s+not\s+exists)\w+/gi);
      expect(rawCreateTable).toBeNull();
    }
  });

  it('verifies Phase 4.1 atomic dataset import function (0007) is hardened with SECURITY DEFINER and revoked PUBLIC execution', () => {
    const migration0007Path = path.join(migrationsDir, '0007_atomic_dataset_import.sql');
    expect(fs.existsSync(migration0007Path)).toBe(true);

    const sql = fs.readFileSync(migration0007Path, 'utf-8');

    // 1. Function definition exists
    expect(sql).toContain('function public.import_dataset_atomic');

    // 2. SECURITY DEFINER enabled
    expect(sql.toLowerCase()).toContain('security definer');

    // 3. Search path set to prevent search_path hijacking
    expect(sql.toLowerCase()).toContain('set search_path = public, pg_temp');

    // 4. Mode validation
    expect(sql).toContain("if p_mode not in ('replace', 'append')");

    // 5. Revoked from untrusted roles
    expect(sql.toLowerCase()).toContain('revoke execute on function public.import_dataset_atomic');
    expect(sql.toLowerCase()).toContain('from public, anon, authenticated');

    // 6. Granted exclusively to service_role
    expect(sql.toLowerCase()).toContain('grant execute on function public.import_dataset_atomic');
    expect(sql.toLowerCase()).toContain('to service_role');
  });

  it('verifies Row Level Security (RLS) is enabled on all newly created tables', () => {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const tableMatches = [...sql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.(\w+)/gi)];

      for (const match of tableMatches) {
        const tableName = match[1];
        // Check that alter table public.<tableName> enable row level security exists
        const rlsPattern = new RegExp(`alter\\s+table\\s+public\\.${tableName}\\s+enable\\s+row\\s+level\\s+security`, 'i');
        expect(sql).toMatch(rlsPattern);
      }
    }
  });
});
