-- VectorHire Phase 4.5: Intelligent Candidate Ingestion Pipeline
-- Run this once in the Supabase SQL editor. Additive/idempotent only.

-- 1. Extend candidates with dataset fields, resume fields, and richer profile fields.
alter table public.candidates
  add column if not exists branch text,
  add column if not exists best_ai_project text,
  add column if not exists research_work text,
  add column if not exists resume_url text,
  add column if not exists resume_text text,
  add column if not exists parsing_status text not null default 'not_applicable'
    check (parsing_status in ('not_applicable', 'pending', 'success', 'failed')),
  add column if not exists parsed_at timestamptz,
  add column if not exists test_la numeric,
  add column if not exists test_code numeric;

-- 2. Dataset upload history.
create table if not exists public.dataset_uploads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  dataset_name text not null,
  uploaded_by text,
  mode text not null check (mode in ('replace', 'append')),
  total_candidates integer not null default 0
);

alter table public.candidates
  add column if not exists dataset_id bigint references public.dataset_uploads(id) on delete set null;

-- 3. Job descriptions.
create table if not exists public.job_descriptions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  requirements text not null
);

-- 4. Job match results (one row per candidate per job description, upserted on re-run).
create table if not exists public.job_match_results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  job_description_id bigint not null references public.job_descriptions(id) on delete cascade,
  match_percentage numeric not null,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  experience_match text not null,
  education_match text not null,
  recommendation text not null,
  evaluated_at timestamptz not null default now(),
  unique (candidate_id, job_description_id)
);

create index if not exists idx_candidates_dataset_id on public.candidates(dataset_id);
create index if not exists idx_job_match_candidate_id on public.job_match_results(candidate_id);
create index if not exists idx_job_match_jd_id on public.job_match_results(job_description_id);

-- RLS: mirror the permissive policy already used on candidates/other tables.
alter table public.dataset_uploads enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.job_match_results enable row level security;

drop policy if exists "Allow all dataset_uploads" on public.dataset_uploads;
create policy "Allow all dataset_uploads" on public.dataset_uploads for all using (true) with check (true);

drop policy if exists "Allow all job_descriptions" on public.job_descriptions;
create policy "Allow all job_descriptions" on public.job_descriptions for all using (true) with check (true);

drop policy if exists "Allow all job_match_results" on public.job_match_results;
create policy "Allow all job_match_results" on public.job_match_results for all using (true) with check (true);
