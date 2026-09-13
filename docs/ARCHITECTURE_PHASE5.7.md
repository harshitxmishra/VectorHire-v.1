# VectorHire — Architecture & Operational Readiness Report (Phase 5.7)
**Phase 5.7: Production Configuration, Deployment Readiness & Operational Hardening**

---

## 1. Executive Summary

Phase 5.7 establishes the authoritative production configuration contract, runtime operational specifications, and deployment runbooks for VectorHire without introducing new cloud infrastructure, microservices, or local Docker requirements.

All existing architectural layers, domain boundaries, queue policies, and security invariants from Phases 0 through 5.6 remain intact and fully validated:

- **Root Vitest Unit Tests**: 82/82 passing
- **Backend Vitest Unit & Integration Tests**: 250/250 passing
- **Dedicated Phase 5.6 Integration Tests**: 37/37 passing
- **Total Test Baseline**: 332/332 passing (100% green)
- **TypeScript Static Verification**: 0 errors (`npx tsc --noEmit`)
- **Backend Build**: Clean compilation (`dist/backend/src/main.js` emitted)
- **Next.js Production Build**: Clean compilation (31 static & dynamic routes compiled, standalone bundle emitted)
- **Git State**: Clean (`git diff --check` passes with zero defects)
- **Docker Boundary**: Preserved and deferred for future deployment; zero Docker runtime requirement for local development, CI, or test execution.

---

## 2. Configuration Inventory

A comprehensive repository-wide audit identified 32 distinct configuration variables utilized across the Next.js frontend, NestJS backend, and BullMQ worker infrastructure:

| Variable Name | Layer / Ownership | Scope & Classification | Default / Fallback | Fail-Fast Required |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Shared | Runtime environment (`production` \| `development` \| `test`) | `'development'` | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Backend | Public Supabase REST/Auth endpoint URL | None | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend Only | Secret server-side key (bypasses RLS for admin queries) | None | Yes (in Prod) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Backend | Browser-safe anonymous client key | `'placeholder-key'` | Yes (in Prod) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend & Backend | Synonym for `NEXT_PUBLIC_SUPABASE_ANON_KEY` | None | No |
| `REDIS_URL` | Backend Only | Connection string (`redis://` TCP or `rediss://` TLS) | None | Yes (or host/port) |
| `REDIS_HOST` | Backend Only | Fallback Redis host | `'127.0.0.1'` | No |
| `REDIS_PORT` | Backend Only | Fallback Redis port | `6379` | No |
| `REDIS_PASSWORD` | Backend Only | Fallback Redis auth password | None | No |
| `REDIS_TLS` | Backend Only | Explicit TLS activation (`'true'` \| `'false'`) | `'false'` | No |
| `PORT` | Frontend / Backend | Web server listen port | `3000` (Next), `4000` (Nest) | No |
| `BACKEND_PORT` | Backend Only | Explicit NestJS backend port | `4000` | No |
| `FRONTEND_URL` | Backend Only | Primary allowed CORS origin | `'http://localhost:3000'` | No |
| `CORS_ORIGINS` | Backend Only | Comma-separated CORS allowed origins list | None | No |
| `AI_PROVIDER` | Backend & Domain | Primary AI provider (`gemini` \| `grok` \| `groq` \| `openrouter` \| `openai`) | `'gemini'` | No |
| `GEMINI_API_KEY` | Backend & Domain | Google Gemini API key | None | No (Fallback chain) |
| `GROK_API_KEY` | Backend & Domain | xAI Grok API key | None | No (Fallback chain) |
| `GROK_MODEL` | Backend & Domain | Grok model identifier | `'grok-2-latest'` | No |
| `GROQ_API_KEY` | Backend & Domain | Groq Cloud API key | None | No (Fallback chain) |
| `GROQ_MODEL` | Backend & Domain | Groq model identifier | `'llama-3.3-70b-versatile'` | No |
| `OPENROUTER_API_KEY` | Backend & Domain | OpenRouter API key | None | No (Fallback chain) |
| `OPENROUTER_MODEL` | Backend & Domain | OpenRouter model identifier | `'openai/gpt-4o-mini'` | No |
| `OPENAI_API_KEY` | Backend & Domain | OpenAI API key | None | No (Fallback chain) |
| `OPENAI_MODEL` | Backend & Domain | OpenAI model identifier | `'gpt-4o-mini'` | No |
| `GMAIL_USER` | Backend & Domain | Gmail SMTP username | None | No (Degrades) |
| `GMAIL_APP_PASSWORD` | Backend & Domain | Gmail SMTP App Password (Secret) | None | No (Degrades) |
| `DEMO_EMAIL_OVERRIDE` | Backend & Domain | Test email address override for demo/staging | None | No |
| `RESEND_API_KEY` | Backend & Domain | Resend email API key | None | No (Degrades) |
| `GITHUB_TOKEN` | Backend & Domain | GitHub PAT (boosts rate limit from 60 to 5,000 req/hr) | None | No (Degrades) |
| `GOOGLE_CLIENT_ID` | Backend & Domain | Google OAuth Client ID for Calendar integration | None | No (Degrades) |
| `GOOGLE_CLIENT_SECRET` | Backend & Domain | Google OAuth Client Secret | None | No (Degrades) |
| `GOOGLE_REDIRECT_URI` | Backend & Domain | Google OAuth redirect callback URI | `'http://localhost:3000/api/auth/google/callback'` | No |
| `GOOGLE_REFRESH_TOKEN` | Backend & Domain | Google OAuth refresh token for Calendar sync | None | No (Degrades) |

---

## 3. Production Environment Contract

1. **Strict Secrets Isolation**:
   - Backend secrets (`SUPABASE_SERVICE_ROLE_KEY`, `REDIS_PASSWORD`, `GMAIL_APP_PASSWORD`, `GOOGLE_CLIENT_SECRET`, AI Provider API keys) are **strictly isolated** from client-side bundles.
   - No backend secrets are prefixed with `NEXT_PUBLIC_`.
2. **Fail-Fast Schema Enforcement**:
   - Validated at process bootstrap via Zod in `backend/src/config/env.validation.ts`.
   - In production (`NODE_ENV === 'production'`), invalid URLs or missing required credentials abort process startup immediately with descriptive variable-level diagnostics.
3. **Graceful Feature Degradation**:
   - Integrations for AI scoring, external SMTP delivery, GitHub profile analytics, and Google Calendar event scheduling degrade gracefully without crashing HTTP endpoints or async queues when optional credentials are omitted.

---

## 4. Vercel Deployment Compatibility

1. **Frontend Host**: Next.js 16 App Router on Vercel Edge/Serverless infrastructure.
2. **Compatibility Verified**:
   - `next.config.mjs` configures `output: 'standalone'` without breaking standard Vercel serverless bundling.
   - All serverless API routes (`app/api/*`) execute statelessly with zero local filesystem persistence assumptions.
   - Heavy background computation is dispatched via Redis BullMQ queues rather than executing inside synchronous Vercel lambda execution windows.

---

## 5. NestJS Backend Runtime Contract

1. **Process Management**:
   - Runtime: Node.js 22 LTS.
   - Entry point: `backend/src/main.ts`.
   - Global API prefix: `/api/v1`.
2. **Process Safety & Graceful Shutdown**:
   - `app.enableShutdownHooks()` handles `SIGTERM` / `SIGINT` signals, closing active Redis connections, draining BullMQ workers, and releasing database connections.
   - `setupProcessSafety()` intercepts `uncaughtException` and `unhandledRejection` events, logs diagnostic traces, and initiates graceful process exit.
3. **Security Invariants**:
   - **Helmet**: Secures response HTTP headers.
   - **Throttling**: Granular rate limits protect candidate uploads, AI endpoints, and auth routes.
   - **Body Limits**: Capped at `1MB` for JSON/urlencoded payloads.
   - **CORS**: Enforces origin matching with credential support; rejects wildcard `*` with credentials.
   - **Authentication**: Strict Supabase JWT validation in production; client-controlled `x-demo-user` headers are rejected with `401 Unauthorized`.

---

## 6. Database Migration Operations

Supabase PostgreSQL schema migrations (`supabase/migrations/`):
- `0002_ingestion_pipeline.sql`: Core candidate schema, raw resumes, parsing status.
- `0003_github_intelligence.sql`: Developer profiles, repositories cache, metrics.
- `0004_workflow_automation.sql`: Interview workflows, calendar events, stages.
- `0005_ai_provider_layer.sql`: Provider audit logs, evaluation metrics.
- `0006_schema_hardening.sql`: RLS policies, performance indexes.
- `0007_atomic_dataset_import.sql`: Hardened `import_dataset_atomic` stored procedure with `SECURITY DEFINER SET search_path = public, pg_temp;` and revoked public execute grants.

---

## 7. Redis & BullMQ Operations

1. **Dual Protocol Support**: Seamlessly connects to `redis://` (TCP) and `rediss://` (TLS) endpoints.
2. **Bounded Reconnection**: Linear-capped backoff terminates after **20 attempts** to prevent connection retry storms during cloud outages.
3. **BullMQ Reliability**:
   - `maxRetriesPerRequest: null` enforced.
   - Exponential job retry backoff (2s initial, 3 attempts).
   - Queue retention: 5,000 completed (7d) and 5,000 failed (7d) jobs.
   - Error string sanitization scrubs passwords from Redis logs.

---

## 8. Worker Operational Contracts

VectorHire operates 6 dedicated BullMQ workers:
1. **AI Evaluation Worker** (`ai-evaluation-queue`, Concurrency: 5)
2. **Resume Parser Worker** (`resume-processing-queue`, Concurrency: 5)
3. **GitHub Insights Worker** (`github-processing-queue`, Concurrency: 5)
4. **Dataset Import Worker** (`dataset-processing-queue`, Concurrency: 5)
5. **Bulk Email Worker** (`email-processing-queue`, Concurrency: 2)
6. **Demonstrator Worker** (`demonstrator-queue`, Concurrency: 5)

---

## 9. Health & Readiness Semantics

- **Liveness (`GET /health/live`)**: Ultra-lightweight process probe; zero external dependencies. Returns `200 OK` `{ status: "ok" }`.
- **Readiness (`GET /health/ready`)**: Verifies active connectivity to Supabase PostgreSQL and Redis. Returns `200 OK` when healthy; `503 Service Unavailable` when any critical dependency is degraded.
- **Composite (`GET /health`)**: Comprehensive operational health report including queue depth metrics; non-blocking and safe during partial outages.

---

## 10. Security Configuration & Auth Hardening

- **No Demo Auth in Production**: `SupabaseAuthGuard` strictly enforces that `x-demo-user` is ignored and rejected in production environments.
- **Destructive Confirmation Guard**: `x-confirm-destructive: true` required for irreversible actions.
- **SSRF Protection**: `validateExternalUrl()` prevents SSRF attacks during resume fetches or webhook calls.

---

## 11. Logging & Correlation ID Tracking

- **X-Correlation-ID**: Auto-generated or propagated from upstream headers on every request.
- **Structured JSON Logging**: Standardized timestamps, correlation IDs, log levels, and contexts.
- **Secrets Sanitization**: Automatically redacts tokens, credentials, and PII from application logs.

---

## 12. Production Runbook

A comprehensive 23-point operational runbook is published at [`docs/PRODUCTION_RUNBOOK.md`](file:///c:/Users/SujeetMishra/Music/VectorHire/VectorHire-v.1/docs/PRODUCTION_RUNBOOK.md).

---

## 13. Deployment Checklist

An operational release checklist covering pre-deployment, deployment execution, smoke testing, and rollback procedures is published at [`docs/DEPLOYMENT_CHECKLIST.md`](file:///c:/Users/SujeetMishra/Music/VectorHire/VectorHire-v.1/docs/DEPLOYMENT_CHECKLIST.md).

---

## 14. Test & Verification Results

| Suite / Check | Files | Tests | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Root Unit Tests** | 14 | 82 | **PASS (82/82)** | Repositories, utils, schemas, auth |
| **Backend Unit & Integration Tests** | 41 | 250 | **PASS (250/250)** | Controllers, services, workers, health, queues |
| **Phase 5.6 Integration Tests** | 6 | 37 | **PASS (37/37)** | Service-repo, health-ready, queue-worker, dataset, auth, migrations |
| **Total Test Baseline** | **55** | **332** | **PASS (332/332)** | 100% test pass rate |
| **Root TypeScript Check** | — | — | **PASS** | `npx tsc --noEmit` clean (0 errors) |
| **Backend Build** | — | — | **PASS** | `npm run build:backend` clean |
| **Next.js Production Build** | — | — | **PASS** | `npm run build` compiled 31 pages cleanly |
| **Git Diff Quality** | — | — | **PASS** | `git diff --check` clean |

---

## 15. Architecture Regression Verification

- `lib/services/` contains **zero NestJS or backend imports**.
- `lib/repositories/` remains **framework-independent**.
- Controllers remain **thin dispatchers** with zero domain business logic.
- BullMQ retry, concurrency, and retention policies remain **fully preserved**.
- AI provider abstraction and fallback logic remain **unchanged**.
- Health and readiness semantics remain **strictly preserved**.
- Phase 5.4 Docker artifacts remain **preserved and Docker-independent for local runs**.
- Phase 5.5 GitHub Actions CI remains **Docker-independent**.

---

## 16. Audit Findings

| Category | Finding ID | Severity | Description | Resolution Status |
| :--- | :--- | :--- | :--- | :--- |
| **A (Blocking)** | — | — | None. | **PASS** |
| **B (Important)** | — | — | None. | **PASS** |
| **C (Minor)** | — | — | None. | **PASS** |
| **D (Informational)** | D-5.7-1 | Informational | Docker artifacts from Phase 5.4 remain preserved in repository for future container deployment; local development continues to execute natively without Docker. | Documented & Verified |

---

## 17. Deferred Items

1. **Production Infrastructure Provisioning (Terraform / Cloud PaaS)**: Intentionally deferred to future deployment phase.
2. **Prometheus / OpenTelemetry Metric Export**: Intentionally deferred to future dedicated observability phase.

---

## 18. Final Verdict

```
============================================================
FINAL VERDICT: PASS — SAFE TO LOCK
============================================================
```
- Total Tests: 332/332 Passing
- Builds: All Clean
- Production Contract: Complete & Documented
- Docker Boundary: Preserved & Docker-Independent
