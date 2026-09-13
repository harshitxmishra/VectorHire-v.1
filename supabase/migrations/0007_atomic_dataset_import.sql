-- VectorHire Phase 4.1: Atomic Dataset Import / Replacement Transaction
-- Executes dataset registration, candidate replacement/append, and timeline generation
-- in a single atomic transaction.

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
  -- Validate mode
  if p_mode not in ('replace', 'append') then
    raise exception 'Invalid mode: %. Must be replace or append', p_mode;
  end if;

  -- Validate candidates payload
  if p_candidates is null or jsonb_typeof(p_candidates) != 'array' or jsonb_array_length(p_candidates) = 0 then
    raise exception 'Candidates list cannot be empty';
  end if;

  -- 1. If replace mode, atomically delete all existing candidates (cascades to timeline/interviews/etc)
  if p_mode = 'replace' then
    delete from public.candidates;
  end if;

  -- 2. Create the dataset upload record
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

  -- 3. Insert each candidate with associated dataset_id and create timeline event
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
    resume_text text,
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
      resume_text,
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
      v_candidate.resume_text,
      coalesce(v_candidate.parsing_status, 'not_applicable'),
      v_candidate.test_la,
      v_candidate.test_code,
      v_dataset_id
    )
    returning id into v_candidate_id;

    -- 4. Atomically record the initial timeline event
    insert into public.candidate_timeline (
      candidate_id,
      event_type,
      details
    ) values (
      v_candidate_id,
      'applied',
      'Imported into dataset'
    );

    v_inserted_count := v_inserted_count + 1;
  end loop;

  -- Build return JSON
  v_result := jsonb_build_object(
    'dataset_id', v_dataset_id,
    'dataset_name', p_dataset_name,
    'mode', p_mode,
    'total_candidates', v_inserted_count,
    'success', true
  );

  return v_result;
end;
$$;

-- Revoke all default EXECUTE privileges from PUBLIC and untrusted client roles
revoke execute on function public.import_dataset_atomic(text, text, text, jsonb) from public, anon, authenticated;

-- Grant EXECUTE exclusively to the service_role used by trusted server-side API operations
grant execute on function public.import_dataset_atomic(text, text, text, jsonb) to service_role;
