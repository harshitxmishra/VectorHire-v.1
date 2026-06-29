-- VectorHire Phase 6: Recruitment Workflow Automation
-- Run once in the Supabase SQL editor. Additive/idempotent only.
-- candidates.status is already free-text and is reused as the pipeline stage
-- (Applied, Reviewing, Shortlisted, Assessment Sent, Assessment Completed,
-- Interview Scheduled, Interview Completed, Offer Extended, Rejected, Hired).
-- No duplicate candidate columns are introduced.

create table if not exists public.interviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  interviewer_name text not null,
  scheduled_date timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  calendar_event_id text,
  meet_link text
);

create table if not exists public.email_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  email_type text not null check (email_type in ('assessment', 'interview', 'offer')),
  recipient text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz
);

create table if not exists public.candidate_timeline (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  event_type text not null,
  details text
);

create index if not exists idx_interviews_candidate_id on public.interviews(candidate_id);
create index if not exists idx_interviews_scheduled_date on public.interviews(scheduled_date);
create index if not exists idx_email_logs_candidate_id on public.email_logs(candidate_id);
create index if not exists idx_timeline_candidate_id on public.candidate_timeline(candidate_id);

alter table public.interviews enable row level security;
alter table public.email_logs enable row level security;
alter table public.candidate_timeline enable row level security;

drop policy if exists "Allow all interviews" on public.interviews;
create policy "Allow all interviews" on public.interviews for all using (true) with check (true);

drop policy if exists "Allow all email_logs" on public.email_logs;
create policy "Allow all email_logs" on public.email_logs for all using (true) with check (true);

drop policy if exists "Allow all candidate_timeline" on public.candidate_timeline;
create policy "Allow all candidate_timeline" on public.candidate_timeline for all using (true) with check (true);
