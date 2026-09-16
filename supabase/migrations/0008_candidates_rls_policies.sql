-- VectorHire: Candidates & Related Tables RLS Policies
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New Query).

-- 1. Ensure RLS is enabled on the candidates table
alter table public.candidates enable row level security;

-- 2. Drop any existing/conflicting candidate policies
drop policy if exists "Allow all on candidates" on public.candidates;
drop policy if exists "Allow public read on candidates" on public.candidates;
drop policy if exists "Allow authenticated read on candidates" on public.candidates;
drop policy if exists "Allow all candidates" on public.candidates;

-- 3. Create permissive policy for candidates table (allows select, insert, update, delete)
create policy "Allow all candidates"
  on public.candidates
  for all
  using (true)
  with check (true);

-- 4. Ensure RLS policies exist across all related VectorHire tables
alter table if exists public.dataset_uploads enable row level security;
alter table if exists public.job_descriptions enable row level security;
alter table if exists public.job_match_results enable row level security;
alter table if exists public.interviews enable row level security;
alter table if exists public.email_logs enable row level security;
alter table if exists public.candidate_timeline enable row level security;

drop policy if exists "Allow all dataset_uploads" on public.dataset_uploads;
create policy "Allow all dataset_uploads" on public.dataset_uploads for all using (true) with check (true);

drop policy if exists "Allow all job_descriptions" on public.job_descriptions;
create policy "Allow all job_descriptions" on public.job_descriptions for all using (true) with check (true);

drop policy if exists "Allow all job_match_results" on public.job_match_results;
create policy "Allow all job_match_results" on public.job_match_results for all using (true) with check (true);

drop policy if exists "Allow all interviews" on public.interviews;
create policy "Allow all interviews" on public.interviews for all using (true) with check (true);

drop policy if exists "Allow all email_logs" on public.email_logs;
create policy "Allow all email_logs" on public.email_logs for all using (true) with check (true);

drop policy if exists "Allow all candidate_timeline" on public.candidate_timeline;
create policy "Allow all candidate_timeline" on public.candidate_timeline for all using (true) with check (true);
