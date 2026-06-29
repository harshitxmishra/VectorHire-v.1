-- VectorHire Phase 5: GitHub Intelligence Engine
-- Run once in the Supabase SQL editor. Additive/idempotent only.

alter table public.candidates
  add column if not exists github_score numeric,
  add column if not exists github_summary text,
  add column if not exists github_languages text[] not null default '{}',
  add column if not exists github_portfolio_verdict text,
  add column if not exists github_highlights text[] not null default '{}',
  add column if not exists github_strongest_repo text,
  add column if not exists github_last_analyzed timestamptz;
