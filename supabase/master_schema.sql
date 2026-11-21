-- ==============================================================================
-- VectorHire Master Database Schema for Supabase
-- Paste and run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Create or extend the candidates table
create table if not exists public.candidates (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null unique,
  college text not null default 'Unknown',
  branch text,
  cgpa numeric not null default 0,
  best_ai_project text,
  research_work text,
  github text,
  resume_url text,
  resume_text text,
  status text not null default 'Applied',
  ai_score numeric not null default 0,
  parsing_status text not null default 'pending' check (parsing_status in ('not_applicable', 'pending', 'success', 'failed')),
  parsed_at timestamptz,
  test_la numeric,
  test_code numeric,
  github_score numeric,
  github_summary text,
  github_languages text[] default '{}',
  github_portfolio_verdict text,
  github_highlights text[] default '{}',
  github_strongest_repo text,
  github_last_analyzed timestamptz,
  ai_evaluation jsonb,
  ai_evaluated_at timestamptz,
  dataset_id bigint
);

-- Ensure all columns exist even if the table already existed
alter table public.candidates
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists college text default 'Unknown',
  add column if not exists branch text,
  add column if not exists cgpa numeric default 0,
  add column if not exists best_ai_project text,
  add column if not exists research_work text,
  add column if not exists github text,
  add column if not exists resume_url text,
  add column if not exists resume_text text,
  add column if not exists status text default 'Applied',
  add column if not exists ai_score numeric default 0,
  add column if not exists parsing_status text default 'pending',
  add column if not exists parsed_at timestamptz,
  add column if not exists test_la numeric,
  add column if not exists test_code numeric,
  add column if not exists github_score numeric,
  add column if not exists github_summary text,
  add column if not exists github_languages text[] default '{}',
  add column if not exists github_portfolio_verdict text,
  add column if not exists github_highlights text[] default '{}',
  add column if not exists github_strongest_repo text,
  add column if not exists github_last_analyzed timestamptz,
  add column if not exists ai_evaluation jsonb,
  add column if not exists ai_evaluated_at timestamptz,
  add column if not exists dataset_id bigint;

-- 2. Create Dataset Uploads table
create table if not exists public.dataset_uploads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  dataset_name text not null,
  uploaded_by text,
  mode text not null check (mode in ('replace', 'append')),
  total_candidates integer not null default 0
);

-- Add foreign key constraint if not present
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'candidates_dataset_id_fkey' and table_name = 'candidates'
  ) then
    alter table public.candidates
      add constraint candidates_dataset_id_fkey foreign key (dataset_id) references public.dataset_uploads(id) on delete set null;
  end if;
end $$;

-- 3. Job Descriptions Table
create table if not exists public.job_descriptions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  requirements text not null
);

-- 4. Job Match Results Table
create table if not exists public.job_match_results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  job_description_id bigint not null references public.job_descriptions(id) on delete cascade,
  match_percentage numeric not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  missing_skills text[] not null default '{}',
  reasoning text not null,
  unique (candidate_id, job_description_id)
);

-- 5. Interviews Table
create table if not exists public.interviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  interviewer_name text not null,
  scheduled_date timestamptz not null,
  duration_minutes integer not null default 45,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled'))
);

-- 6. Email Logs Table
create table if not exists public.email_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint references public.candidates(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  email_type text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text
);

-- 7. Candidate Timeline Table
create table if not exists public.candidate_timeline (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  candidate_id bigint not null references public.candidates(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  metadata jsonb
);

-- 8. Indexes for High Performance
create index if not exists idx_candidates_email on public.candidates(email);
create index if not exists idx_candidates_status on public.candidates(status);
create index if not exists idx_candidates_college on public.candidates(college);
create index if not exists idx_candidates_dataset on public.candidates(dataset_id);
create index if not exists idx_interviews_candidate on public.interviews(candidate_id);
create index if not exists idx_email_logs_candidate on public.email_logs(candidate_id);
create index if not exists idx_timeline_candidate on public.candidate_timeline(candidate_id);

-- 9. Atomic Dataset Import Function
create or replace function public.import_dataset_atomic(
  p_dataset_name text,
  p_uploaded_by text,
  p_mode text,
  p_candidates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dataset_id bigint;
  v_inserted_count integer := 0;
  v_candidate record;
  v_candidate_id bigint;
  v_result jsonb;
begin
  if p_mode not in ('replace', 'append') then
    raise exception 'Invalid mode: %. Must be replace or append', p_mode;
  end if;

  if p_candidates is null or jsonb_typeof(p_candidates) != 'array' or jsonb_array_length(p_candidates) = 0 then
    raise exception 'Candidates list cannot be empty';
  end if;

  if p_mode = 'replace' then
    delete from public.candidates;
  end if;

  insert into public.dataset_uploads (
    dataset_name,
    uploaded_by,
    mode,
    total_candidates
  ) values (
    p_dataset_name,
    p_uploaded_by,
    p_mode,
    jsonb_array_length(p_candidates)
  )
  returning id into v_dataset_id;

  for v_candidate in select * from jsonb_to_recordset(p_candidates) as x(
    full_name text,
    email text,
    college text,
    cgpa numeric,
    github text,
    status text,
    ai_score numeric,
    branch text,
    best_ai_project text,
    research_work text,
    resume_url text,
    parsing_status text,
    test_la numeric,
    test_code numeric
  )
  loop
    insert into public.candidates (
      full_name,
      email,
      college,
      cgpa,
      github,
      status,
      ai_score,
      branch,
      best_ai_project,
      research_work,
      resume_url,
      parsing_status,
      test_la,
      test_code,
      dataset_id
    ) values (
      v_candidate.full_name,
      v_candidate.email,
      coalesce(v_candidate.college, 'Unknown'),
      coalesce(v_candidate.cgpa, 0),
      v_candidate.github,
      coalesce(v_candidate.status, 'Applied'),
      coalesce(v_candidate.ai_score, 0),
      v_candidate.branch,
      v_candidate.best_ai_project,
      v_candidate.research_work,
      v_candidate.resume_url,
      coalesce(v_candidate.parsing_status, 'pending'),
      v_candidate.test_la,
      v_candidate.test_code,
      v_dataset_id
    )
    returning id into v_candidate_id;

    v_inserted_count := v_inserted_count + 1;

    insert into public.candidate_timeline (
      candidate_id,
      event_type,
      title,
      description,
      metadata
    ) values (
      v_candidate_id,
      'candidate_created',
      'Candidate Ingested',
      'Imported via dataset: ' || p_dataset_name,
      jsonb_build_object('dataset_id', v_dataset_id, 'mode', p_mode)
    );
  end loop;

  update public.dataset_uploads
  set total_candidates = v_inserted_count
  where id = v_dataset_id;

  select jsonb_build_object(
    'dataset_id', v_dataset_id,
    'total_candidates', v_inserted_count,
    'mode', p_mode
  ) into v_result;

  return v_result;
end;
$$;

-- 10. Enable Row Level Security (RLS) & Policies
alter table public.candidates enable row level security;
alter table public.dataset_uploads enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.job_match_results enable row level security;
alter table public.interviews enable row level security;
alter table public.email_logs enable row level security;
alter table public.candidate_timeline enable row level security;

-- Permissive development policies for authenticated/anon keys
create policy "Allow all for authenticated users on candidates" on public.candidates for all using (true) with check (true);
create policy "Allow all for authenticated users on dataset_uploads" on public.dataset_uploads for all using (true) with check (true);
create policy "Allow all for authenticated users on job_descriptions" on public.job_descriptions for all using (true) with check (true);
create policy "Allow all for authenticated users on job_match_results" on public.job_match_results for all using (true) with check (true);
create policy "Allow all for authenticated users on interviews" on public.interviews for all using (true) with check (true);
create policy "Allow all for authenticated users on email_logs" on public.email_logs for all using (true) with check (true);
create policy "Allow all for authenticated users on candidate_timeline" on public.candidate_timeline for all using (true) with check (true);
