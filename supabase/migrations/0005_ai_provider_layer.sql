-- VectorHire: AI provider abstraction support.
-- Adds a persisted cache for the general AI evaluation so it is never
-- re-run unless explicitly requested ("Re-evaluate"), matching the existing
-- caching pattern already used for github_score/github_last_analyzed.
-- Run once in the Supabase SQL editor. Additive/idempotent only.

alter table public.candidates
  add column if not exists ai_evaluation jsonb,
  add column if not exists ai_evaluated_at timestamptz;
