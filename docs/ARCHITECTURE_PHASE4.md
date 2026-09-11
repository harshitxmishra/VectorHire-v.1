# VectorHire Architecture — Phase 4: Infrastructure, Reliability & Asynchronous Processing

## 1. Phase 4 Overview & Roadmap

Phase 4 focuses on infrastructure reliability, transactional integrity, and asynchronous job processing for compute-heavy workflows.

### Phase 4 Roadmap:
- **Phase 4.1 — Transaction / Atomicity Boundary** `[COMPLETED]`
- **Phase 4.2 — Redis + BullMQ Foundation** `[COMPLETED / CURRENT]`
- **Phase 4.3 — Asynchronous AI Evaluation Workers** `[PLANNED - NOT IMPLEMENTED]`
- **Phase 4.4 — Asynchronous Resume Parsing & GitHub Intelligence Workers** `[PLANNED - NOT IMPLEMENTED]`
- **Phase 4.5 — Asynchronous Dataset Ingestion Workers** `[PLANNED - NOT IMPLEMENTED]`
- **Phase 4.6 — Bulk Email Dispatch Queue** `[PLANNED - NOT IMPLEMENTED]`
- **Phase 4.7 — Reliability, Rate Limiting & Observability** `[PLANNED - NOT IMPLEMENTED]`

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
Existing workflows remain synchronous and unchanged in Phase 4.2:
- `/api/v1/ai/evaluate` (Synchronous)
- `/api/v1/candidates/:id/parse-resume` (Synchronous)
- `/api/v1/ai/github` (Synchronous)
- `/api/v1/datasets` (Synchronous & Atomic via `import_dataset_atomic`)
- `/api/v1/emails/send` (Synchronous)

### 3.15 Phase 4.3+ Roadmap
- **Phase 4.3**: Asynchronous AI Evaluation Workers (migrating matching and candidate scoring to BullMQ).
- **Phase 4.4**: Asynchronous Resume Parsing & GitHub Intelligence Workers.
- **Phase 4.5**: Asynchronous Dataset Ingestion Workers.
- **Phase 4.6**: Bulk Email Dispatch Queue.
- **Phase 4.7**: Reliability, Rate Limiting & Observability.

