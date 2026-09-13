# VectorHire — Production Deployment Checklist
**Phase 5.7: Operational Hardening & Release Verification**

Use this checklist prior to, during, and after deploying VectorHire to production environments (e.g., Vercel for Frontend and Node.js VM/PaaS for NestJS Backend).

---

## 1. Pre-Deployment Verification

### 1.1 Code Quality & Build Validation
- [ ] **Root Unit Tests**: All root Vitest tests pass (`npm test` -> 82/82 tests passing).
- [ ] **Backend Unit & Integration Tests**: All backend Vitest suites pass (`npm run test:backend` -> 250/250 tests passing).
- [ ] **Dedicated Integration Suites**: All integration suites pass (`npm run test:integration` -> 37/37 tests passing).
- [ ] **TypeScript Typecheck**: Full project clean compile (`npx tsc --noEmit` -> 0 errors).
- [ ] **Backend Build**: Backend compiles cleanly (`npm run build:backend` -> emits `dist/backend/src/main.js`).
- [ ] **Next.js Production Build**: Frontend compiles cleanly (`npm run build` -> 31 pages compiled, standalone bundle emitted).
- [ ] **Git Cleanliness**: No merge conflict markers or whitespace defects (`git diff --check` -> clean).

### 1.2 Database & Migration Readiness
- [ ] **Migration Sequence Intact**: Migrations `0002_` through `0007_` exist in `supabase/migrations/` and have been tested sequentially.
- [ ] **Database Backup**: Fresh full backup/snapshot created in Supabase before applying migrations.
- [ ] **Security Definer Functions**: `import_dataset_atomic` function verified with `SET search_path = public, pg_temp` and permissions revoked from `PUBLIC`/`anon`.
- [ ] **Row-Level Security (RLS)**: RLS enabled on all production tables (`candidates`, `jobs`, `interviews`, `timeline_events`, `datasets`).

### 1.3 Production Environment Variables
- [ ] `NODE_ENV=production` set on both frontend and backend.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured with live production Supabase URL.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set only on the backend (never exposed via `NEXT_PUBLIC_`).
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured on frontend and backend.
- [ ] `REDIS_URL` configured with managed production Redis (`rediss://` for TLS).
- [ ] `CORS_ORIGINS` / `FRONTEND_URL` configured to exact production domains (no wildcard `*` allowed).
- [ ] Optional AI Provider keys configured (`GEMINI_API_KEY`, etc.) with valid production credentials.
- [ ] No placeholder values (e.g., `placeholder-key`, `http://localhost:3000`) remain in production environment configurations.

---

## 2. Deployment Execution

### 2.1 Backend Deployment (NestJS)
- [ ] **Deploy Backend Code**: Deploy `dist/` or repository to target Node.js 22 LTS runtime.
- [ ] **Process Manager / Service**: Start backend service with automatic restart (`pm2`, systemd, or container manager).
- [ ] **Worker Verification**: Confirm all 6 BullMQ workers initialize successfully:
  - [ ] AI Evaluation Worker (`ai-evaluation-queue`, concurrency: 5)
  - [ ] Resume Parser Worker (`resume-processing-queue`, concurrency: 5)
  - [ ] GitHub Worker (`github-processing-queue`, concurrency: 5)
  - [ ] Dataset Import Worker (`dataset-processing-queue`, concurrency: 5)
  - [ ] Bulk Email Worker (`email-processing-queue`, concurrency: 2)
  - [ ] Demonstrator Worker (`demonstrator-queue`, concurrency: 5)
- [ ] **Liveness Probe Check**: Verify `GET /health/live` returns HTTP 200 `{ status: "ok" }`.
- [ ] **Readiness Probe Check**: Verify `GET /health/ready` returns HTTP 200 `{ status: "ok", checks: { database: "ok", redis: "ok" } }`.

### 2.2 Frontend Deployment (Vercel)
- [ ] **Trigger Vercel Build**: Deploy to Vercel production environment.
- [ ] **Environment Scope**: Confirm `NEXT_PUBLIC_*` variables are exposed to client builds; server-only secrets are restricted.
- [ ] **Build Output**: Confirm build completes with zero errors and edge/serverless routes deploy properly.

---

## 3. Post-Deployment Smoke Testing

### 3.1 Authentication & Security Smoke Tests
- [ ] **Unauthenticated Access**: Direct API calls to protected endpoints (e.g., `GET /api/v1/candidates`) without auth return `401 Unauthorized`.
- [ ] **Demo Header Spoofing**: Requests with `x-demo-user: dev-admin-01` in production are strictly rejected (`401 Unauthorized`).
- [ ] **Valid User Login**: Sign in via Supabase Auth on frontend; session token successfully acquired.
- [ ] **Authenticated API Request**: User can fetch candidates with bearer token; response returns HTTP 200.
- [ ] **Destructive Guard**: Deleting a dataset without `x-confirm-destructive: true` returns HTTP 400.

### 3.2 Core Feature Smoke Tests
- [ ] **Candidate Creation**: Create a test candidate via UI or API; candidate appears in candidate directory.
- [ ] **Timeline Event**: Candidate creation records an entry in the candidate's activity timeline.
- [ ] **Job Posting**: Create and retrieve a job description.
- [ ] **AI Evaluation / Queue Smoke Test**: Trigger candidate evaluation; verify BullMQ job enqueues, worker picks up the job, and evaluation completes with scores.
- [ ] **Dataset Import**: Ingest a sample CSV dataset; verify atomic transaction finishes and candidates are populated.

### 3.3 Observability & Log Verification
- [ ] **Structured Log Format**: Confirm logs output structured JSON with timestamps, levels, and contexts.
- [ ] **Correlation ID Tracking**: Confirm `x-correlation-id` header is returned in HTTP responses and appears in corresponding backend logs.
- [ ] **Secret Sanitization**: Confirm no API keys, database credentials, passwords, or auth tokens appear in log streams.
- [ ] **Error Rate**: Verify zero unhandled exceptions or unexpected 5xx errors in initial operational window.

---

## 4. Rollback & Emergency Plan

If critical failures occur during deployment:

1. **Frontend Rollback**: Instant rollback via Vercel dashboard to previous stable deployment.
2. **Backend Rollback**: Revert application process to previous stable release artifact/tag.
3. **Database Recovery**: If a migration causes schema corruption, restore PostgreSQL state from the pre-migration snapshot taken in Step 1.2.
4. **Queue Draining**: If worker bugs cause job failures, pause queues via BullMQ or backend restart while debugging.
