-- Migration 0009: Offer Letters & Workflow Audit Log
-- VectorHire Production Schema Extension

CREATE TABLE IF NOT EXISTS offer_letters (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role_title TEXT NOT NULL,
  annual_salary NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE NOT NULL,
  expiration_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
  decline_reason TEXT,
  responded_at TIMESTAMPTZ,
  s3_pdf_key TEXT,
  s3_pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_offer_letters_token ON offer_letters(token);
CREATE INDEX IF NOT EXISTS idx_offer_letters_candidate_id ON offer_letters(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_status ON offer_letters(status);

-- Workflow Transition Audit Logs
CREATE TABLE IF NOT EXISTS workflow_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workflow_audit_logs_candidate ON workflow_audit_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_workflow_audit_logs_created_at ON workflow_audit_logs(created_at DESC);
