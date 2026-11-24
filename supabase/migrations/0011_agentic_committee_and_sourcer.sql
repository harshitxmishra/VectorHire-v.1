-- Migration 0011: Agentic Committee & HITL Outbound Sourcer Schema
-- VectorHire Autonomous Agentic Technical Evaluation & Sourcing Engine

-- 1. Agent Evaluation Traces & Committee Transcripts Schema
CREATE TABLE IF NOT EXISTS agent_evaluation_traces (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_id BIGINT REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id BIGINT REFERENCES job_descriptions(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('STRONG_HIRE', 'LEAN_HIRE', 'LEAN_NO_HIRE', 'NO_HIRE')),
  calibrated_score INT NOT NULL CHECK (calibrated_score >= 0 AND calibrated_score <= 100),
  debate_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  claim_verification_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
  inspected_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_specific_interview_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_traces JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_eval_candidate_id ON agent_evaluation_traces(candidate_id);
CREATE INDEX IF NOT EXISTS idx_agent_eval_job_id ON agent_evaluation_traces(job_description_id);
CREATE INDEX IF NOT EXISTS idx_agent_eval_hash ON agent_evaluation_traces(content_hash);
CREATE INDEX IF NOT EXISTS idx_agent_eval_created_at ON agent_evaluation_traces(created_at DESC);

-- Enable RLS and setup policies for agent_evaluation_traces
ALTER TABLE agent_evaluation_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to agent_evaluation_traces"
  ON agent_evaluation_traces FOR SELECT
  TO authenticated, anon, service_role
  USING (true);

CREATE POLICY "Allow insert access to agent_evaluation_traces"
  ON agent_evaluation_traces FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

CREATE POLICY "Allow update access to agent_evaluation_traces"
  ON agent_evaluation_traces FOR UPDATE
  TO authenticated, anon, service_role
  USING (true);


-- 2. Sourced Prospects (Human-in-the-Loop Sourcing Queue) Schema
CREATE TABLE IF NOT EXISTS sourced_prospects (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_description_id BIGINT REFERENCES job_descriptions(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  profile_url TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  cited_repos JSONB NOT NULL DEFAULT '[]'::jsonb,
  personalized_email_draft TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_HUMAN_APPROVAL' CHECK (status IN ('PENDING_HUMAN_APPROVAL', 'APPROVED', 'REJECTED', 'IMPORTED')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  candidate_id BIGINT REFERENCES candidates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sourced_prospects_jd_id ON sourced_prospects(job_description_id);
CREATE INDEX IF NOT EXISTS idx_sourced_prospects_status ON sourced_prospects(status);
CREATE INDEX IF NOT EXISTS idx_sourced_prospects_username ON sourced_prospects(github_username);
CREATE INDEX IF NOT EXISTS idx_sourced_prospects_created_at ON sourced_prospects(created_at DESC);

-- Enable RLS and setup policies for sourced_prospects
ALTER TABLE sourced_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to sourced_prospects"
  ON sourced_prospects FOR SELECT
  TO authenticated, anon, service_role
  USING (true);

CREATE POLICY "Allow insert access to sourced_prospects"
  ON sourced_prospects FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

CREATE POLICY "Allow update access to sourced_prospects"
  ON sourced_prospects FOR UPDATE
  TO authenticated, anon, service_role
  USING (true);
