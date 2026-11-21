import crypto from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { AIEvaluationResult, GitHubIntelligence } from '@/lib/types';

// Fast in-memory cache fallback
const memAiCache = new Map<string, { evaluation: AIEvaluationResult; expiresAt: number }>();
const memGithubCache = new Map<string, { intelligence: GitHubIntelligence; expiresAt: number }>();

/**
 * Computes deterministic SHA-256 hash of text or object content.
 */
export function computeContentHash(input: unknown): string {
  const content = typeof input === 'string' ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 1500): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Database timeout')), ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Retrieves cached AI candidate evaluation by content hash.
 * Meets the requirement of sub-5s latency (typically < 30ms).
 */
export async function getCachedAIEvaluation(contentHash: string): Promise<AIEvaluationResult | null> {
  const now = Date.now();

  // 1. In-memory check
  const memHit = memAiCache.get(contentHash);
  if (memHit && memHit.expiresAt > now) {
    return { ...memHit.evaluation, cached: true };
  }

  // 2. Database cache check with bounded timeout
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('ai_evaluation_cache')
        .select('scorecard, overall_score, expires_at')
        .eq('content_hash', contentHash)
        .single()
    );

    if (!error && data && new Date(data.expires_at).getTime() > now) {
      const evaluation = data.scorecard as AIEvaluationResult;
      memAiCache.set(contentHash, {
        evaluation,
        expiresAt: new Date(data.expires_at).getTime(),
      });
      return { ...evaluation, cached: true };
    }
  } catch (err) {
    // Graceful fallback to memory
  }

  return null;
}

/**
 * Saves AI candidate evaluation to cache with TTL (default 7 days).
 */
export async function setCachedAIEvaluation(
  contentHash: string,
  candidateId: number | null,
  jobDescriptionId: number | null,
  evaluation: AIEvaluationResult,
  ttlDays = 7
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();
  const overallScore = evaluation.overall_score ?? evaluation.score ?? 70;

  // 1. Save in memory
  memAiCache.set(contentHash, {
    evaluation,
    expiresAt: new Date(expiresAt).getTime(),
  });

  // 2. Save in PostgreSQL with bounded timeout
  try {
    await withTimeout(
      supabase.from('ai_evaluation_cache').upsert(
        {
          content_hash: contentHash,
          candidate_id: candidateId,
          job_description_id: jobDescriptionId,
          overall_score: overallScore,
          scorecard: evaluation,
          expires_at: expiresAt,
        },
        { onConflict: 'content_hash' }
      )
    );
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Retrieves cached GitHub intelligence by profile hash.
 */
export async function getCachedGitHubIntelligence(profileHash: string): Promise<GitHubIntelligence | null> {
  const now = Date.now();

  // 1. In-memory check
  const memHit = memGithubCache.get(profileHash);
  if (memHit && memHit.expiresAt > now) {
    return memHit.intelligence;
  }

  // 2. Database cache check with bounded timeout
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('github_intelligence_cache')
        .select('intelligence, expires_at')
        .eq('profile_hash', profileHash)
        .single()
    );

    if (!error && data && new Date(data.expires_at).getTime() > now) {
      const intel = data.intelligence as GitHubIntelligence;
      memGithubCache.set(profileHash, {
        intelligence: intel,
        expiresAt: new Date(data.expires_at).getTime(),
      });
      return intel;
    }
  } catch (err) {
    // Non-fatal fallback
  }

  return null;
}

/**
 * Saves GitHub intelligence to cache with TTL (default 7 days).
 */
export async function setCachedGitHubIntelligence(
  profileHash: string,
  username: string,
  intelligence: GitHubIntelligence,
  ttlDays = 7
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();

  // 1. Save in memory
  memGithubCache.set(profileHash, {
    intelligence,
    expiresAt: new Date(expiresAt).getTime(),
  });

  // 2. Save in PostgreSQL with bounded timeout
  try {
    await withTimeout(
      supabase.from('github_intelligence_cache').upsert(
        {
          profile_hash: profileHash,
          username,
          score: intelligence.score,
          sub_scores: intelligence.subScores ?? {},
          intelligence,
          expires_at: expiresAt,
        },
        { onConflict: 'profile_hash' }
      )
    );
  } catch (err) {
    // Non-fatal
  }
}
