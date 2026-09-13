# VectorHire — Production Operational Runbook
**Phase 5.7: Production Configuration, Deployment Readiness & Operational Hardening**

---

## 1. Architecture Overview

VectorHire is a production-oriented TypeScript modular monolith designed for scalable AI-assisted recruitment and talent intelligence.

```
                  ┌──────────────────────────────┐
                  │ Next.js 16 / React 19 App    │ (Deployed on Vercel / Edge CDN)
                  └──────────────┬───────────────┘
                                 │ HTTP / REST (JWT Auth)
                                 ▼
                  ┌──────────────────────────────┐
                  │ NestJS Modular Backend API   │ (Node.js 22 LTS Runtime)
                  │  - Global Prefix: /api/v1    │
                  │  - Helmet, Throttling, CORS  │
                  │  - Structured JSON Logging   │
                  │  - Correlation ID Tracking   │
                  └───────┬──────────────┬───────┘
                          │              │
             PostgreSQL / │              │ BullMQ Enqueue
             Supabase REST│              ▼
                          │      ┌───────────────┐
                          │      │  Redis Cache  │ (redis:// or rediss://)
                          │      │  & Queue Bus  │
                          │      └───────┬───────┘
                          │              │ Job Dispatch
                          ▼              ▼
                  ┌──────────────┐ ┌───────────────────────────┐
                  │  Supabase /  │ │ 6 Asynchronous Workers    │
                  │  PostgreSQL  │ │  1. AI Evaluation Worker  │
                  │  (pgvector)  │ │  2. Resume Parser Worker  │
                  └──────────────┘ │  3. GitHub Worker         │
                                   │  4. Dataset Import Worker │
                                   │  5. Email Worker          │
                                   │  6. Demonstrator Worker   │
                                   └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │ Domain / App Services     │
                                   │  - AI Provider Fallback   │
                                   │  - Gmail / Resend SMTP    │
                                   │  - GitHub Octokit API     │
                                   │  - Google Calendar OAuth  │
                                   └───────────────────────────┘
```

---

## 2. Required Environment Variables

### 2.1 Backend Required Variables
These variables **must** be provided in production environments. Missing or malformed required variables trigger fail-fast termination at process bootstrap via Zod validation (`backend/src/config/env.validation.ts`):

| Variable Name | Type | Description | Production Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `enum` | Runtime environment (`production`, `development`, `test`). In `production`, development auth shortcuts (`x-demo-user`) are completely rejected. | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | `url` | Fully-qualified URL of the Supabase project endpoint. | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | High-privilege server-side secret key for backend database operations. **Never leak to frontend**. | `eyJhbGciOiJIUzI1NiIsIn...` |
| `REDIS_URL` | `string` | Connection URL starting with `redis://` (plain TCP) or `rediss://` (TLS). Takes precedence over host/port fallback. | `rediss://default:secret@managed-redis.com:6379` |
| `PORT` or `BACKEND_PORT` | `number` | Port on which the NestJS backend listens (default: `4000`). | `4000` |
| `FRONTEND_URL` / `CORS_ORIGINS` | `string` | Comma-separated list of allowed origins for CORS. Wildcard `*` with credentials is explicitly rejected. | `https://vectorhire.ai,https://app.vectorhire.ai` |

### 2.2 Frontend (Vercel) Required Variables
| Variable Name | Target | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser & Server | Public Supabase endpoint for client auth and SSR queries. | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Public | Client-side anonymous key for Supabase Auth and RLS-protected queries. | `eyJhbGciOiJIUzI1NiIsIn...` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser Public | Synonym/alias for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. | `eyJhbGciOiJIUzI1NiIsIn...` |

---

## 3. Optional Integrations & Graceful Degradation

When optional provider keys are omitted, VectorHire starts normally and gracefully degrades specific non-critical features without crashing:

| Integration | Variables | Degradation Behavior if Absent |
| :--- | :--- | :--- |
| **AI Provider Fallback Chain** | `AI_PROVIDER`, `GEMINI_API_KEY`, `GROK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY` | Iterates configured provider keys in fallback order (`gemini` → `grok` → `groq` → `openrouter` → `openai`). If all keys are absent or exhausted, AI evaluation returns structured deterministic fallback results or logs an error without crashing. |
| **Email Notifications** | `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `RESEND_API_KEY`, `DEMO_EMAIL_OVERRIDE` | Email worker logs a warning and skips physical SMTP delivery. In demo/staging, `DEMO_EMAIL_OVERRIDE` safely reroutes all outgoing messages to a designated QA inbox. |
| **GitHub Intelligence** | `GITHUB_TOKEN` | Uses unauthenticated GitHub Public API (limited to 60 requests/hour instead of 5,000 requests/hour with PAT). |
| **Google Calendar Scheduling** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN` | Interview scheduling records the interview in PostgreSQL and logs a warning skipping external Google Calendar event creation. |

---

## 4. Vercel Frontend Configuration

1. **Deployment Type**: Next.js 16 App Router on Vercel.
2. **Build Configuration**:
   - Build Command: `npm run build`
   - Output Directory: Next.js default (`.next`)
   - Framework Preset: Next.js
3. **Stateless Runtime Contract**:
   - Vercel Serverless/Edge functions must remain completely stateless. No local disk filesystem persistence is assumed.
   - Long-running asynchronous tasks (AI batch evaluation, resume PDF parsing, dataset batch ingestion) **must not execute inside Vercel serverless request handlers**. They are enqueued to Redis BullMQ queues for processing by dedicated backend workers.
4. **Environment Isolation**:
   - Backend-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `GMAIL_APP_PASSWORD`) must **never** be prefixed with `NEXT_PUBLIC_` or added to Vercel client environment variables.

---

## 5. NestJS Backend Runtime Contract

1. **Process Bootstrap**:
   - Entry point: `backend/src/main.ts`
   - Framework: NestJS 11 on Express
   - Global Prefix: `/api/v1`
   - Shutdown Hooks: `app.enableShutdownHooks()` enabled for graceful `SIGTERM` / `SIGINT` handling.
   - Process Fatal Handlers: `setupProcessSafety()` captures unhandled promise rejections and uncaught exceptions, logs structured diagnostics, and initiates graceful shutdown.
2. **Security Headers & Rate Limiting**:
   - **Helmet**: Enabled globally for secure HTTP headers.
   - **Throttler**: `@nestjs/throttler` enforces granular rate limiting across candidate imports, AI operations, and auth routes.
   - **Payload Limits**: Express JSON and URL-encoded body parsers strictly capped at `1MB` to prevent DoS memory exhaustion.
3. **Authentication Enforcement in Production**:
   - When `NODE_ENV === 'production'`, `SupabaseAuthGuard` strictly requires a valid Supabase JWT bearer token or session cookie.
   - Any attempt to pass `x-demo-user` headers is rejected with `401 Unauthorized`.
   - Destructive operations (such as dataset replacement or bulk candidate deletion) require the `x-confirm-destructive: true` confirmation header.

---

## 6. Database Migration Operations

Supabase PostgreSQL migrations are located in `supabase/migrations/` and must be applied sequentially:

```
0002_ingestion_pipeline.sql   -> Candidates, raw resumes, parsing metadata
0003_github_intelligence.sql  -> GitHub profiles, repository caches, metrics
0004_workflow_automation.sql  -> Hiring stages, interview schedules, calendar tokens
0005_ai_provider_layer.sql    -> Evaluation audits, scoring records, provider logs
0006_schema_hardening.sql     -> Row Level Security (RLS) policies, indexes
0007_atomic_dataset_import.sql-> import_dataset_atomic() stored procedure
```

### Migration Operational Rules:
1. **Pre-Migration Backup**: Always create a full database snapshot before running migrations in production (`supabase db dump` or Cloud console backup).
2. **Security Definer Hardening**: `0007_atomic_dataset_import.sql` specifies `SECURITY DEFINER SET search_path = public, pg_temp;` and explicitly revokes `EXECUTE` on `import_dataset_atomic` from `PUBLIC` and `anon`, granting access only to `authenticated` and `service_role`.
3. **Rollback Limitations**: Destructive data operations (e.g., table drops or column truncations) cannot be rolled back automatically. In case of migration failure, restore from the pre-migration snapshot.

---

## 7. Redis & BullMQ Operational Contract

1. **Protocol Support**:
   - `redis://` -> Standard unencrypted TCP connection (local / internal VPC).
   - `rediss://` -> Encrypted TLS connection with SNI verification (production managed Redis, e.g., Upstash, AWS ElastiCache, Redis Enterprise).
2. **Connection Resilience**:
   - `lazyConnect: true` prevents initial connection failures from crashing the HTTP server.
   - Bounded reconnect strategy: linear backoff (100ms–3000ms) capped at **20 attempts** to prevent reconnect storms.
   - `maxRetriesPerRequest: null` enforced for BullMQ blocking commands.
   - 30s TCP keep-alive (`keepAlive: 30000`) and 10s connect timeout (`connectTimeout: 10000`).
3. **Queue Health & Metric Sanitization**:
   - Error messages and connection strings are sanitized via `sanitizeRedisErrorMessage()` to prevent credential leakage in logs.

---

## 8. Worker Operational Contract

VectorHire manages 6 asynchronous BullMQ workers:

| Worker Name | Queue Name | Concurrency | Retry Policy | Retention Policy | Idempotency Key / Safety |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI Evaluation Worker** | `ai-evaluation-queue` | 5 | 3 attempts, exponential backoff (2s initial) | 5,000 completed (7d), 5,000 failed (7d) | Candidate ID + Job ID evaluation hash |
| **Resume Parser Worker** | `resume-processing-queue` | 5 | 3 attempts, exponential backoff (2s initial) | 5,000 completed (7d), 5,000 failed (7d) | Candidate ID + document SHA-256 |
| **GitHub Insights Worker** | `github-processing-queue` | 5 | 3 attempts, exponential backoff (5s initial) | 5,000 completed (7d), 5,000 failed (7d) | GitHub username + sync timestamp |
| **Dataset Import Worker** | `dataset-processing-queue` | 5 | 3 attempts, exponential backoff (2s initial) | 5,000 completed (7d), 5,000 failed (7d) | Dataset ID + atomic transaction |
| **Bulk Email Worker** | `email-processing-queue` | 2 | 3 attempts, exponential backoff (3s initial) | 5,000 completed (7d), 5,000 failed (7d) | Email log record ID (deduplication) |
| **Demonstrator Worker** | `demonstrator-queue` | 5 | 3 attempts, exponential backoff (1s initial) | 5,000 completed (7d), 5,000 failed (7d) | Session ID |

---

## 9. Health & Readiness Probes

### 9.1 Liveness Probe (`GET /health/live` & `GET /api/v1/health/live`)
- **Purpose**: Verifies that the Node.js/NestJS process is alive and processing the event loop.
- **Dependencies**: **Zero external dependencies**. Does not query Supabase or Redis.
- **Response**: `200 OK` `{ status: "ok" }`.

### 9.2 Readiness Probe (`GET /health/ready` & `GET /api/v1/health/ready`)
- **Purpose**: Verifies that the backend can serve traffic by actively pinging PostgreSQL and Redis.
- **Dependencies**: Supabase PostgreSQL database ping + Redis queue ping.
- **Responses**:
  - `200 OK` `{ status: "ok", checks: { database: "ok", redis: "ok" } }` when all dependencies are healthy.
  - `503 Service Unavailable` `{ status: "degraded", checks: { database: "ok", redis: "unavailable" } }` when any dependency is unreachable.

### 9.3 Composite Health (`GET /health` & `GET /api/v1/health`)
- **Purpose**: Full diagnostic status including uptime, dependency status, and queue depth metrics.
- **Safety**: Safe and non-blocking; does not throw on dependency degradation.

---

## 10. Logging & Correlation ID Troubleshooting

1. **Correlation IDs**:
   - Every incoming HTTP request is assigned a unique `x-correlation-id` UUID (or inherits one from upstream gateways).
   - The correlation ID is propagated across controller actions, BullMQ job metadata, worker processing steps, and response headers (`x-correlation-id`).
2. **Structured JSON Logs**:
   - Format: `{"timestamp":"...","correlationId":"...","level":"info","message":"...","context":"..."}`.
   - PII and Secrets Redaction: Authorization headers, tokens, passwords, and sensitive candidate PII are automatically scrubbed before logging.
3. **Troubleshooting Steps**:
   - To trace a failed operation end-to-end, filter production logs by correlation ID:
     ```bash
     grep "corr-xxxx-xxxx" /var/log/vectorhire/backend.log
     ```

---

## 11. Incident Response & Outage Runbooks

### 11.1 Redis Outage
- **Symptoms**: Readiness probe returns HTTP 503 (`checks.redis: "unavailable"`). Asynchronous queue jobs cannot be enqueued or processed.
- **Impact**: Synchronous read/write operations (browsing candidates, viewing jobs) continue working via Supabase. Background workers pause reconnection attempts after 20 retries.
- **Remediation**:
  1. Verify Redis cluster status on managed provider console.
  2. Ensure TLS (`rediss://`) and port 6379/6380 are accessible.
  3. Once Redis is restored, restart the backend service to resume worker queues.

### 11.2 Database Outage
- **Symptoms**: Readiness probe returns HTTP 503 (`checks.database: "unavailable"`). API requests return 500/503.
- **Impact**: All data persistence and queries are halted.
- **Remediation**:
  1. Check Supabase project status dashboard.
  2. Verify connection pooler (PgBouncer) limits and active connection count.
  3. Verify `SUPABASE_SERVICE_ROLE_KEY` has not expired or been rotated.

### 11.3 AI Provider Outages
- **Symptoms**: AI Evaluation Worker logs warnings for failed provider requests.
- **Impact**: Worker automatically cascades through the fallback chain (Gemini → Grok → Groq → OpenRouter → OpenAI).
- **Remediation**:
  1. Inspect worker logs to identify failing provider error codes (e.g., 429 rate limit or 503 service unavailable).
  2. Set `AI_PROVIDER` environment variable to a healthy provider or update provider API keys in production secrets.
