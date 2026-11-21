-- Migration 0010: pgvector extension & evaluation caching
-- VectorHire Deep Intelligence & High-Performance Caching Layer

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector embeddings to candidates and job descriptions
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS resume_embedding vector(768),
  ADD COLUMN IF NOT EXISTS github_embedding vector(768);

ALTER TABLE job_descriptions
  ADD COLUMN IF NOT EXISTS requirements_embedding vector(768);

-- 3. AI Evaluation Cache Table (Content-hash + TTL caching)
CREATE TABLE IF NOT EXISTS ai_evaluation_cache (
  id BIGSERIAL PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  candidate_id BIGINT,
  job_description_id BIGINT,
  overall_score INT NOT NULL,
  scorecard JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_eval_cache_hash ON ai_evaluation_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_ai_eval_cache_expires_at ON ai_evaluation_cache(expires_at);

-- 4. GitHub Intelligence Cache Table
CREATE TABLE IF NOT EXISTS github_intelligence_cache (
  id BIGSERIAL PRIMARY KEY,
  profile_hash TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  score INT NOT NULL,
  sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  intelligence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_github_intel_cache_hash ON github_intelligence_cache(profile_hash);
CREATE INDEX IF NOT EXISTS idx_github_intel_cache_username ON github_intelligence_cache(username);
CREATE INDEX IF NOT EXISTS idx_github_intel_cache_expires_at ON github_intelligence_cache(expires_at);

-- 5. pgvector Cosine Similarity Match RPC
CREATE OR REPLACE FUNCTION match_candidates_to_job(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  candidate_id bigint,
  full_name text,
  email text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS candidate_id,
    c.full_name,
    c.email,
    1 - (c.resume_embedding <=> query_embedding) AS similarity
  FROM candidates c
  WHERE c.resume_embedding IS NOT NULL
    AND 1 - (c.resume_embedding <=> query_embedding) > match_threshold
  ORDER BY c.resume_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
