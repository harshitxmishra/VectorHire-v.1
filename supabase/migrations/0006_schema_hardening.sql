-- VectorHire Phase 0: Database Schema Hardening
-- Run once in the Supabase SQL editor. Additive/idempotent only.

-- 1. Enforce validation constraint on candidate status.
-- Covers all 11 canonical pipeline stages + 4 legacy/ingestion statuses.
alter table public.candidates
  drop constraint if exists check_candidates_status;

alter table public.candidates
  add constraint check_candidates_status check (
    lower(status) in (
      'applied',
      'reviewing',
      'shortlisted',
      'assessment sent',
      'assessment completed',
      'interview eligible',
      'interview scheduled',
      'interview completed',
      'offer extended',
      'rejected',
      'hired',
      'pending',
      'new',
      'reviewed',
      'interview'
    )
  );

-- 2. Add performance and lookup indexes for frequently queried columns.
create index if not exists idx_candidates_status on public.candidates(status);
create index if not exists idx_candidates_ai_score on public.candidates(ai_score desc);
create index if not exists idx_candidates_email on public.candidates(email);
create index if not exists idx_candidates_college on public.candidates(college);

create index if not exists idx_email_logs_candidate_lookup on public.email_logs(candidate_id, email_type, status);
create index if not exists idx_timeline_candidate_created on public.candidate_timeline(candidate_id, created_at asc);
