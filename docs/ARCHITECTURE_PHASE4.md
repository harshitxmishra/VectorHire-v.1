# VectorHire Architecture — Phase 4: Infrastructure, Reliability & Asynchronous Processing

## 1. Phase 4 Overview & Roadmap

Phase 4 focuses on infrastructure reliability, transactional integrity, and asynchronous job processing for compute-heavy workflows.

### Phase 4 Roadmap:
- **Phase 4.1 — Transaction / Atomicity Boundary** `[COMPLETED]`
- **Phase 4.2 — Redis + BullMQ Foundation** `[COMPLETED]`
- **Phase 4.3 — Asynchronous AI Evaluation Workers** `[COMPLETED]`
- **Phase 4.4 — Asynchronous Resume Parsing & GitHub Intelligence Workers** `[COMPLETED]`
- **Phase 4.5 — Asynchronous Dataset Ingestion Workers** `[COMPLETED]`
- **Phase 4.6 — Bulk Email Dispatch Queue** `[COMPLETED]`
- **Phase 4.7 — Reliability, Observability & Structured Telemetry** `[COMPLETED]`

> **Important Note on Current Scope:**
> Phase 4.1 introduces transactional atomicity for dataset replacement. Redis, BullMQ, worker queues, Docker containers, and background processing are NOT implemented in Phase 4.1 and remain scheduled for subsequent sub-phases.

---

## 2. Phase 4.1: Dataset Replacement Transaction & Atomicity

### 2.1 The Problem in Phase 3
In Phase 3, dataset replacement executed sequential database operations across the network without a transactional boundary:
1. `CandidateRepository.deleteAll()` (deleted existing candidates)
2. `DatasetRepository.create()` (inserted upload record)
3. `CandidateRepository.createMany()` (inserted new candidates)
4. `TimelineRepository.create()` (inserted initial timeline events)

**Failure / Corruption Risks:**
- If step 3 or step 4 failed (e.g. database constraint violation, invalid candidate data, network timeout), previous candidates were already destroyed and the database was left in an empty or partially populated state.
- Orphan `dataset_uploads` records were created without candidates.
- Inconsistent timeline lifecycle records occurred.

---

### 2.2 Chosen Transaction Strategy: PostgreSQL Stored Procedure (`import_dataset_atomic`)

To solve atomicity without introducing complex ORMs (Prisma / Drizzle) or breaking the framework-independent repository architecture:
- We introduced a transactional PostgreSQL stored function: `public.import_dataset_atomic(p_dataset_name, p_uploaded_by, p_mode, p_candidates)`.
- Stored in migration [`supabase/migrations/0007_atomic_dataset_import.sql`](file:///c:/Users/SujeetMishra/Music/VectorHire/VectorHire-v.1/supabase/migrations/0007_atomic_dataset_import.sql).
- PostgreSQL functions execute inside a single implicit ACID database transaction.

### 2.3 Why This Strategy Was Selected
1. **True ACID Guarantees**: PostgreSQL automatically rolls back the entire transaction block on any runtime error, constraint violation, or client disconnection.
2. **Framework & Driver Independence**: The repository interface (`DatasetRepository`) exposes standard TypeScript domain types and methods (`importAtomic`).
3. **No Heavyweight ORM**: Eliminates the need for Prisma/Drizzle just to obtain multi-statement transactions over the Supabase Data API.
4. **Performance**: Reduces 4 round-trip network hops to a single atomic database execution.

---

### 2.4 Exact Transaction Boundary
The single atomic transaction encompasses:
1. **Candidate Purge (Replace mode only)**: Atomically deletes existing candidates from `public.candidates` (cascading to dependent foreign keys).
2. **Dataset Audit Record**: Inserts a new record into `public.dataset_uploads` and returns `v_dataset_id`.
3. **Candidate Batch Insertion**: Bulk inserts candidate rows into `public.candidates` linked to `v_dataset_id`.
4. **Lifecycle Timeline Event Generation**: Atomically logs `'applied'` event in `public.candidate_timeline` for every newly inserted candidate.

---

### 2.5 Replace vs. Append Semantics
- **`mode = 'replace'`**: Clears the candidate table before inserting the new batch. If any insertion fails, the purge is rolled back and previous candidates remain untouched.
- **`mode = 'append'`**: Leaves existing candidates intact, inserts new candidate records with the new `dataset_id`, and logs timeline events. If any insertion fails, all additions are rolled back.

---

### 2.6 Timeline Decision
Timeline events are treated as mandatory audit records for candidate lifecycle initialization. By including timeline event generation inside `import_dataset_atomic`, we guarantee that candidates are never created without their corresponding audit history.

---

### 2.7 Rollback Behavior
- If any candidate violates schema validation (e.g. invalid status, missing email, invalid types), PostgreSQL aborts execution and rolls back all modifications.
- The pre-existing database state remains completely intact.
- The error is captured by the repository and mapped to a standard error.

---

### 2.8 Security Hardening & Privilege Isolation Model

The PostgreSQL stored procedure `public.import_dataset_atomic` is treated as **privileged infrastructure**, shielded from direct untrusted client RPC execution:

1. **Why `SECURITY DEFINER` is Required**:
   - Multi-table dataset replacement atomically modifies `public.candidates`, `public.dataset_uploads`, and `public.candidate_timeline`.
   - Executing as `SECURITY DEFINER` allows the function to execute these cross-table batch mutations with the authority of the schema owner without granting broad, direct table-level `DELETE`/`INSERT` permissions to low-privilege client connections.

2. **Why `search_path` is Explicitly Pinned**:
   - To prevent `SECURITY DEFINER` search-path hijacking attacks, the function explicitly declares `SET search_path = public, pg_temp`.
   - All referenced objects are schema-qualified (`public.candidates`, `public.dataset_uploads`, `public.candidate_timeline`), preventing malicious users from creating temporary objects to shadow standard tables or functions.

3. **Why `PUBLIC`, `anon`, and `authenticated` EXECUTE is Revoked**:
   - In PostgreSQL, functions in `public` are granted `EXECUTE` to `PUBLIC` by default. PostgREST automatically exposes such functions as callable REST RPC endpoints (`/rest/v1/rpc/import_dataset_atomic`).
   - If left unrestricted, an unauthenticated client (`anon`) or an arbitrary authenticated end-user (`authenticated`) could issue direct HTTP requests to wipe the candidates table in `replace` mode.
   - To prevent bypassing the application's authentication, admin verification, and `x-confirm-destructive` header checks, `EXECUTE` is explicitly revoked from `PUBLIC`, `anon`, and `authenticated`.

4. **Permitted Execution Role (`service_role`)**:
   - `EXECUTE` is granted exclusively to `service_role`.
   - The trusted server-side backend client (`lib/supabase/client.ts`) uses `SUPABASE_SERVICE_ROLE_KEY` to authenticate as `service_role`.
   - No browser client or external PostgREST connection can invoke `import_dataset_atomic`.

5. **Integrity with NestJS Application Authorization**:
   - All dataset import and replacement requests MUST flow through the NestJS application layer (`POST /api/v1/datasets/import`):
     - `SupabaseAuthGuard` verifies the user's JWT.
     - `AdminGuard` / admin validation ensures the user has import privileges.
     - `x-confirm-destructive` header enforces explicit user confirmation for `mode = 'replace'`.
   - Only after all guards pass does the application service delegate to `DatasetRepository.importAtomic`, which executes via the trusted `service_role`. This ensures complete defense-in-depth without duplicating custom RBAC logic inside SQL.

---

## 3. Phase 4.2: Redis + BullMQ Queue Foundation

> **Scope Confirmation:**
> Phase 4.2 establishes queue infrastructure only. Existing AI, resume, GitHub, dataset, and email workflows remain synchronous until their respective migration phases.

### 3.1 Why Redis is Being Introduced
Redis provides a high-performance, in-memory data store with atomic primitives, pub/sub, and stream persistence. In VectorHire, Redis acts as the backing broker for BullMQ job queues, enabling durable job buffering, concurrency control, and rate limiting across asynchronous background workers without placing locking strain on PostgreSQL.

### 3.2 Why BullMQ is Being Introduced
BullMQ is the modern, TypeScript-native distributed queue standard for Node.js. It provides robust job lifecycles (waiting, active, delayed, failed, completed), automatic exponential retry backoffs, deduplication, concurrency control, and telemetry out of the box.

### 3.3 Redis vs. BullMQ Roles
- **Redis**: The transport and storage layer (holds queues, job hashes, sorted sets for delayed/retried jobs, and lock keys).
- **BullMQ**: The orchestration and lifecycle framework (manages workers, job enqueuing, backoff scheduling, rate limiting, and failure states).

### 3.4 Queue vs. Worker Distinction
- **Queue (`QueueService` / `Queue`)**: Enqueues jobs, assigns IDs, sets retry options, and checks infrastructure health. Enqueueing is fast and non-blocking.
- **Worker (`DemonstratorWorker` / `Worker`)**: Consumes jobs asynchronously, executes handler logic, and reports completion or errors. Workers run independently and do not block HTTP request cycles.

### 3.5 Current Queue Architecture
```text
                  NestJS API
                     │
                     ▼
             Queue Infrastructure
                     │
                     ▼
                  BullMQ
                     │
                     ▼
                   Redis
                     │
                     ▼
             Demonstrator Worker
```

### 3.6 Centralized Queue & Job Naming Conventions
All queue and job names are defined as constants in [`backend/src/queue/queue.constants.ts`](file:///c:/Users/SujeetMishra/Music/VectorHire/VectorHire-v.1/backend/src/queue/queue.constants.ts):
- **Demonstrator Queue**: `QUEUE_NAMES.DEMONSTRATOR = 'demonstrator-queue'`
- **Demonstrator Job**: `JOB_NAMES.DEMONSTRATOR_PING = 'demonstrator:ping'`

*Future queues in subsequent phases will follow this established naming pattern:*
- `ai-evaluation-queue` (`ai:evaluate`, `ai:match`)
- `resume-parsing-queue` (`resume:parse`)
- `github-insights-queue` (`github:analyze`)
- `email-dispatch-queue` (`email:send`)

### 3.7 Job Payload Design Principles
Job payloads in BullMQ must remain lightweight, strongly typed, and decoupled from heavy database entities:
- **Do NOT** serialize complete entities, full resumes, raw CSV files, or API credentials into Redis.
- **DO** include resource IDs, minimal operational flags, and correlation IDs for distributed tracing.
- **Demonstrator Payload Contract**:
  ```typescript
  export interface DemonstratorJobData {
    message: string;
    correlationId: string;
    timestamp: number;
    shouldFail?: boolean;
  }
  ```

### 3.8 Retry Policy & Backoff Configuration
Default queue retry parameters are configured centrally:
```typescript
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    age: 3600, // keep completed jobs 1 hour
    count: 1000,
  },
  removeOnFail: {
    age: 86400, // keep failed jobs 24 hours
    count: 5000,
  },
};
```
*Note on Retry Separation:* Queue retries handle background worker crashes or transient infrastructure issues. The existing AI client (`lib/ai/client.ts`) retains its own provider fallback and retry logic for in-flight LLM calls.

### 3.9 Failure Handling
- Throwing an unhandled exception inside a worker handler marks the job attempt as failed in BullMQ.
- BullMQ automatically reschedules the job according to the exponential backoff policy until `attempts` is exhausted.
- Exhausted jobs transition to the `failed` state in Redis, allowing inspection without crashing the NestJS application process.

### 3.10 Graceful Shutdown
Both `QueueService` and `DemonstratorWorker` implement NestJS `OnApplicationShutdown`:
- Workers stop accepting new jobs and wait for active processing to complete via `worker.close()`.
- Queue instances close connection handles via `queue.close()`.
- Redis client connections terminate cleanly with `redis.quit()`.

### 3.11 Redis Health Checking
`QueueService.isRedisHealthy()` performs an isolated `PING` with a 1.5s timeout. The backend health endpoint (`GET /api/v1/health`) incorporates Redis reachability (`{ redis: { status: 'healthy' | 'unhealthy' | 'unreachable' } }`) without exposing credentials, connection strings, or treating Redis failure as a fatal process crash.

### 3.12 Security Considerations
- Redis is an internal infrastructure service and is never exposed directly to the public web or frontend clients.
- Environment variables (`REDIS_URL`, `REDIS_HOST`, `REDIS_PASSWORD`, `REDIS_TLS`) are loaded securely via `dotenv` / `ConfigModule`.
- Secrets, tokens, and sensitive job payloads are strictly excluded from logging.

### 3.13 Demonstrator Job
The demonstrator queue/worker validates end-to-end BullMQ infrastructure with a zero-side-effect payload:
- Verifies enqueuing, payload typing, processing, intentional failure retry handling, and graceful shutdown without performing any AI, database, or email operations.

### 3.14 Workloads NOT Yet Migrated
Existing workflows remaining for later Phase 4 sub-phases:
- `/api/v1/datasets` (Synchronous & Atomic via `import_dataset_atomic` — Phase 4.5)
- `/api/v1/emails/send` (Synchronous — Phase 4.6)

### 3.15 Phase 4+ Roadmap
- **Phase 4.1**: Atomic Dataset Replacement (Complete)
- **Phase 4.2**: Redis + BullMQ Queue Foundation (Complete)
- **Phase 4.3**: Asynchronous AI Evaluation Worker (Complete)
- **Phase 4.4**: Asynchronous Resume Parsing & GitHub Intelligence Workers (Complete)
- **Phase 4.5**: Asynchronous Dataset Ingestion Workers
- **Phase 4.6**: Bulk Email Dispatch Queue
- **Phase 4.7**: Reliability, Rate Limiting & Observability

---

## 4. Phase 4.3: Asynchronous AI Evaluation Worker

### 4.1 Architectural Overview
Phase 4.3 migrates the computationally intensive, multi-second AI candidate evaluation workflow from synchronous HTTP request blocking to an asynchronous BullMQ queue and worker pipeline within the NestJS backend modular monolith.

```
Next.js Frontend (Polling / Optimistic)
       │
       ▼ (POST /api/v1/ai/evaluate - 202 Accepted { jobId, status: 'queued' })
NestJS AiController
       │
       ▼ (enqueueAiEvaluation)
QueueService
       │
       ▼ (ai-evaluation-queue)
BullMQ + Redis
       │
       ▼ (Concurrency: 5, Exponential Backoff)
AiEvaluationWorker
       │
       ▼
AiService / lib/ai/client.ts (Multi-provider fallback & retry)
       │
       ▼ (Atomic update + Timeline audit)
Supabase (candidates table + timeline_events)
```

### 4.2 Key Invariants Maintained
1. **Repository Abstraction & Framework Independence**:
   - `lib/repositories/*` and `lib/services/*` remain pure TypeScript and framework-agnostic.
   - Database writes occur via repositories / Supabase service clients.
2. **Provider Multi-Model Resilience**:
   - `lib/ai/client.ts` provider fallback, prompt formatting, schema validation, and retry mechanisms remain completely intact and unaltered.
3. **Candidate Evaluation Caching**:
   - If a candidate already has an `ai_evaluation` record in Supabase and `force !== true`, `AiController` returns the cached evaluation immediately without enqueuing a queue job.
   - When `force === true` (Recruiter Re-evaluate), a new background evaluation job is enqueued.
4. **Idempotency**:
   - The worker executes `AiService.evaluateCandidate(data)` which writes to `candidates` by `id = candidate_id` and records timeline events. Re-running a job updates the evaluation record deterministically.
5. **Separation of Retries**:
   - **Queue-level retries** (BullMQ 3 attempts, exponential backoff: 1s, 2s, 4s) handle unexpected worker crashes, redis connection drops, and transient process faults.
   - **AI-level retries** (`lib/ai/client.ts` fallback chain across Gemini, Groq, Grok, OpenAI, OpenRouter) handle model rate limits and transient provider HTTP errors.
6. **Security & Authentication**:
   - `POST /api/v1/ai/evaluate` and `GET /api/v1/ai/jobs/:jobId` remain protected by `SupabaseAuthGuard`.
   - All external GitHub fetching within evaluation goes through the SSRF-guarded fetch pipeline.

### 4.3 Queue & Worker Configuration
- **Queue Name**: `ai-evaluation-queue` (`QUEUE_NAMES.AI_EVALUATION`)
- **Job Name**: `ai:evaluate` (`JOB_NAMES.AI_EVALUATE`)
- **Worker Concurrency**: `5` concurrent evaluations per NestJS instance.
- **Worker Graceful Shutdown**: `AiEvaluationWorker` implements `OnApplicationShutdown`, safely closing BullMQ worker threads and redis client handles.
- **Job Status Polling**: `GET /api/v1/ai/jobs/:jobId` exposes state (`waiting`, `active`, `completed`, `failed`), correlation ID, completed result, error description, and timestamps.

### 4.4 Frontend Polling Flow
1. Recruiter clicks **Evaluate with AI** or **Re-evaluate**.
2. Frontend sends `POST /api/v1/ai/evaluate`.
3. If response status is `completed` (cache hit), result is rendered immediately.
4. If response status is `queued`, frontend polls `GET /api/v1/ai/jobs/:jobId` at 1-second intervals (up to 60s) until the job reaches `completed` or `failed`.
5. Recruiter drawer displays live progress spinner while in `evaluating` state and automatically updates with full insights and score once completed.

---

## 5. Phase 4.4: Asynchronous Resume Parsing & GitHub Intelligence Workers

### 5.1 Architectural Overview
Phase 4.4 migrates expensive document processing (Resume PDF fetching, SSRF checks, and multimodal LLM text extraction) and repository analytics (GitHub REST API requests, metadata parsing, and LLM engineering maturity analysis) from synchronous HTTP execution to asynchronous BullMQ workers.

```
Next.js Frontend (Polling)
       │
       ├─► (POST /api/v1/candidates/:id/parse-resume - 202 Accepted { jobId, status: 'queued' })
       │   └── Enqueues to resume-processing-queue ──► ResumeWorker (concurrency 5)
       │       └── ResumeService.parseResume ──► safeFetchResumeBuffer (SSRF check) ──► aiGenerateText ──► candidates update
       │
       └─► (POST /api/v1/ai/github - 202 Accepted { jobId, status: 'queued' })
           └── Enqueues to github-processing-queue ──► GithubWorker (concurrency 5)
               └── GithubService.analyzeCandidate ──► GitHub API + aiGenerateJSON ──► candidates update + timeline audit
```

### 5.2 Key Invariants Maintained
1. **SSRF Protections Preserved**:
   - Resume URL retrieval inside the worker passes strictly through `safeFetchResumeBuffer` (`lib/utils/ssrf-protection.ts`), resolving DNS records and blocking loopback/link-local/private IP ranges before issuing HTTP requests.
   - Redis job data stores only the minimal identifier (`candidateId`, `correlationId`, `enqueuedAt`), never raw buffers or documents.
2. **GitHub Cache Semantics**:
   - `getOrAnalyzeGitHub` checks the 7-day TTL (`CACHE_TTL_MS`). When fresh and `force !== true`, `GithubController` immediately returns `{ jobId: 'cached-<id>', status: 'completed', result }` without enqueuing a queue job.
   - When `force === true`, a fresh background job is enqueued to bypass the cache.
3. **Idempotency & Retries**:
   - **Resume Parsing**: Updating `candidates` (`resume_text`, `parsing_status`, `parsed_at`) is keyed on candidate ID primary key. Automatic BullMQ retries overwrite in place cleanly without creating duplicate records.
   - **GitHub Analysis**: Updates `candidates` record in place. On retry, the fresh timestamp is recognized, returning cached analysis without repeating external GitHub or AI API calls.
4. **Retry Separation**:
   - BullMQ queue retries (3 attempts, 1s exponential backoff) handle worker process crashes and transient infrastructure failures.
   - AI provider retries in `lib/ai/client.ts` handle upstream AI rate limits and provider failovers.
5. **Security & Authorization**:
   - All endpoints (`/api/v1/candidates/:id/parse-resume`, `/api/v1/candidates/jobs/:jobId`, `/api/v1/ai/github`, `/api/v1/ai/github/jobs/:jobId`) require valid Supabase JWT authentication.
   - No tokens, API keys, or prompt texts enter Redis.

### 5.3 Queue & Worker Configuration
- **Resume Processing**:
  - Queue: `resume-processing-queue` (`QUEUE_NAMES.RESUME_PROCESSING`)
  - Job Name: `resume:parse` (`JOB_NAMES.RESUME_PARSE`)
  - Worker: `ResumeWorker` (Concurrency: 5)
  - Status Endpoint: `GET /api/v1/candidates/jobs/:jobId`
- **GitHub Processing**:
  - Queue: `github-processing-queue` (`QUEUE_NAMES.GITHUB_PROCESSING`)
  - Job Name: `github:analyze` (`JOB_NAMES.GITHUB_ANALYZE`)
  - Worker: `GithubWorker` (Concurrency: 5)
  - Status Endpoint: `GET /api/v1/ai/github/jobs/:jobId`

---

## 6. Phase 4.5: Asynchronous Dataset Processing Workers

### 6.1 Architectural Overview
Phase 4.5 moves heavy dataset CSV uploads, row parsing, candidate entity normalization, and batch database insertions out of the synchronous HTTP request path into a dedicated asynchronous BullMQ worker (`DatasetWorker`).

```
Next.js Frontend (DatasetManagerDialog)
       │
       ▼ (POST /api/v1/datasets/import - Multipart FormData)
NestJS DatasetsController
       │
       ├─► Validates file format (.csv, max 10MB) & authentication (SupabaseAuthGuard)
       ├─► Generates secure UUID uploadId & stages CSV file in dedicated temp directory (vectorhire_uploads/)
       ├─► Enqueues DatasetImportJobData to dataset-processing-queue
       ├─► Returns HTTP 202 Accepted { jobId, status: 'queued', correlationId }
       │
BullMQ / Redis (Holds minimal metadata: uploadId, datasetName, uploadedBy, mode, correlationId)
       │
       ▼
DatasetWorker (Concurrency: 5)
       │
       ├─► Resolves staged CSV text via uploadId from dedicated staging directory (Path Traversal Guard)
       ├─► Parses and maps candidate rows via parseCSV and mapCandidateRow
       ├─► Invokes DatasetsService.importDatasetAtomic (PostgreSQL import_dataset_atomic)
       │     └─► Single atomic transaction: purge/insert candidates, record dataset_uploads, create timeline events
       └─► Unlinks staged temporary file in deterministic finally block
```

### 6.2 Key Invariants Maintained
1. **Phase 4.1 Atomicity Preserved**:
   - The PostgreSQL `import_dataset_atomic` function is invoked unchanged. All database mutations (candidate replacement/insertion, dataset audit log creation, and initial timeline events) commit or roll back together atomically.
2. **Zero CSV in Redis Payload**:
   - `DatasetImportJobData` carries only `{ uploadId, datasetName, uploadedBy, mode, correlationId, enqueuedAt }`.
   - Raw CSV text, candidate arrays, credentials, and tokens are strictly excluded from Redis.
3. **Staged File Lifecycle & Path Traversal Guards**:
   - Files are staged in `path.join(os.tmpdir(), 'vectorhire_uploads')` named strictly as `upload_<uuid>.csv`.
   - Paths are validated against directory traversal using strict UUID regex and directory boundary containment checks.
   - Files are unlinked upon worker job completion or failure, with startup cleanup pruning any stale files older than 1 hour.
4. **Retry Safety**:
   - In `replace` mode, retries cleanly overwrite candidates in place with identical parsed state.
   - Atomic all-or-nothing rollback ensures failed import attempts leave no partial database records.
5. **Security & Authorization**:
   - Both `POST /api/v1/datasets/import` and `GET /api/v1/datasets/jobs/:jobId` require `SupabaseAuthGuard`.

### 6.3 Queue & Worker Configuration
- **Queue**: `dataset-processing-queue` (`QUEUE_NAMES.DATASET_PROCESSING`)
- **Job Name**: `dataset:import` (`JOB_NAMES.DATASET_IMPORT`)
- **Worker**: `DatasetWorker` (Concurrency: 5)
- **Status Endpoint**: `GET /api/v1/datasets/jobs/:jobId`
- **Default Job Options**: 3 attempts, exponential backoff (delay 1000ms), removeOnComplete (1h / 1000 jobs), removeOnFail (24h / 5000 jobs).

---

## 7. Phase 4.6: Asynchronous Bulk Email Workers

### 7.1 Architectural Overview
Phase 4.6 migrates synchronous, blocking email dispatches (assessment invitations, interview notifications, and job offers) to an asynchronous BullMQ queue and background worker pipeline (`EmailWorker`).

```
Next.js Frontend (Assessments & Candidates Pages)
       │
       ▼ (POST /api/v1/emails/send - JSON { candidateIds, type, force, ... })
NestJS EmailController
       │
       ├─► Validates SendEmailDto & extracts authenticated user identity (SupabaseAuthGuard)
       ├─► Enqueues EmailJobData to email-processing-queue
       ├─► Returns HTTP 202 Accepted { jobId, status: 'queued', correlationId }
       │
BullMQ / Redis (Holds minimal metadata: candidateIds: number[], type, force, correlationId)
       │
       ▼
EmailWorker (Concurrency: 2)
       │
       ├─► Delegates to EmailService.sendEmails(job.data)
       ├─► Fetches candidates by ID via CandidateRepository
       ├─► Deduplicates against email_logs (findSentCandidateIds) when force !== true
       ├─► Dispatches email per candidate via EmailProvider abstraction (Nodemailer / SMTP)
       ├─► Updates email_logs (pending ➔ sent / failed) & logs candidate_timeline audit event
       └─► Transitions candidate status (e.g., 'Assessment Sent', 'Offer Extended')
```

### 7.2 Key Invariants Maintained
1. **Delivery Guarantee & Idempotency Analysis**:
   - **Delivery Guarantee**: **At-Least-Once Processing**.
   - **Database-Level Deduplication**: When `force !== true`, `findSentCandidateIds` queries `email_logs` for `status = 'sent'`. Candidates previously sent that email type are safely skipped with `status: 'skipped', error: 'Already sent.'`.
   - **Retry After Commit Safety**: If the worker successfully delivers an email, marks `email_logs` as `sent`, and crashes before BullMQ ACK, a retry will find the existing `sent` log and skip re-sending.
   - **Unavoidable Provider-Limited Edge Case**: If a crash occurs *during* the external SMTP transmission before updating `email_logs`, SMTP (Gmail) lacks native idempotency keys, meaning a retry could deliver a duplicate email. This is documented and accepted as an intrinsic constraint of standard SMTP.
   - **Explicit Resend Semantics**: When `force === true`, deduplication checks are intentionally bypassed to allow legitimate recruiter re-sends.
2. **Lean Redis Payload**:
   - `EmailJobData` contains only `candidateIds: number[]`, `type`, optional assessment template parameters, `correlationId`, `enqueuedAt`, and `requestedBy`.
   - **Zero** full HTML bodies, email contents, credentials, tokens, or candidate objects are stored in Redis.
3. **Framework-Independent Domain Layer**:
   - `lib/services/email-service.ts` remains pure TypeScript with zero `@nestjs/*`, `bullmq`, `ioredis`, or `backend/*` dependencies.
   - Introduced `EmailProvider` interface (`sendEmail({ to, subject, html })`) with `NodemailerEmailProvider` default implementation.
4. **Conservative Concurrency & Rate Limiting**:
   - `EmailWorker` is configured with `concurrency: 2` to prevent SMTP connection flooding, socket timeouts, and provider rate-limiting.
5. **Security & Authorization**:
   - `POST /api/v1/emails/send` and `GET /api/v1/emails/jobs/:jobId` require `SupabaseAuthGuard`.
   - Job status responses expose safe state, correlation metadata, and counts without exposing credentials or internal provider details.
6. **Frontend Polling**:
   - UI callers (`app/assessments/page.tsx` and `app/candidates/page.tsx`) poll `GET /api/v1/emails/jobs/:jobId` at 1-second intervals with a 60-second bounded timeout, cleaning up on unmount or terminal state.

### 7.3 Queue & Worker Configuration
- **Queue**: `email-processing-queue` (`QUEUE_NAMES.EMAIL_PROCESSING`)
- **Job Name**: `email:send` (`JOB_NAMES.EMAIL_SEND`)
- **Worker**: `EmailWorker` (Concurrency: 2)
- **Status Endpoint**: `GET /api/v1/emails/jobs/:jobId`
- **Default Job Options**: 3 attempts, exponential backoff (delay 1000ms), removeOnComplete (1h / 1000 jobs), removeOnFail (24h / 5000 jobs).

---

## 8. Phase 4.7: Reliability, Observability & Structured Telemetry

### 8.1 Health Semantics: Application Liveness vs. Dependency Health
VectorHire distinguishes between HTTP process liveness and external dependency availability (Redis):
- **When Redis is Healthy**:
  - HTTP 200 `{ status: "ok", uptime: number, timestamp: string, redis: { status: "ok" }, queues: SystemQueueMetrics }`
- **When Redis is Unreachable**:
  - HTTP 200 `{ status: "degraded", uptime: number, timestamp: string, redis: { status: "unreachable" }, queues: null }`
  - Health check remains non-blocking and never crashes due to Redis outages.

### 8.2 Strict Telemetry Allowlist & PII Protection
`StructuredLogger` enforces an explicit allowlist of telemetry fields (`ALLOWED_TELEMETRY_KEYS`):
- **Allowed Fields**: `event`, `timestamp`, `correlationId`, `queue`, `jobId`, `jobName`, `durationMs`, `attempt`, `maxAttempts`, `status`, `errorCode`, `errorCategory`, `worker`.
- **Explicitly Excluded**: Candidate names, email addresses, phone numbers, resume text, OAuth/GitHub tokens, SMTP credentials, API keys, authorization headers, raw payloads, database connection strings, and stack traces.
- **Worker Lifecycle Events**:
  - `queue.job.started`
  - `queue.job.completed`
  - `queue.job.retrying` (when `attempt < maxAttempts`)
  - `queue.job.failed` (when `attempt >= maxAttempts`)

### 8.3 Correlation ID Resolution & Propagation Boundary
`resolveCorrelationId(headerValue)` enforces strict boundary validation:
- Validates regex `/^[a-zA-Z0-9_-]{1,64}$/`.
- If missing, invalid, or length > 64, falls back to generating a UUID v4.
- Propagates cleanly through:
  `HTTP Header (x-correlation-id) ➔ Controller ➔ QueueService ➔ BullMQ job.data.correlationId ➔ Worker ➔ Structured Telemetry`
- Framework independence preserved: `lib/services/*` and `lib/repositories/*` contain zero NestJS or framework dependencies.

### 8.4 Safe Queue Metrics & Error Sanitization
- `QueueService.getSystemQueueMetrics()` aggregates operational counts (`waiting`, `active`, `completed`, `failed`, `delayed`, `paused`) across all 6 queues without throwing unhandled exceptions.
- `sanitizeJobErrorMessage(failedReason)` prevents leaking internal filesystem paths, SQL schemas, or credentials in public job status polling endpoints.

