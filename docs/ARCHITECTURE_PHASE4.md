# VectorHire Architecture — Phase 4: Infrastructure, Reliability & Asynchronous Processing

## 1. Phase 4 Overview & Roadmap

Phase 4 focuses on infrastructure reliability, transactional integrity, and asynchronous job processing for compute-heavy workflows.

### Phase 4 Roadmap:
- **Phase 4.1 — Transaction / Atomicity Boundary** `[COMPLETED / CURRENT]`
- **Phase 4.2 — Redis + BullMQ Foundation** `[PLANNED - NOT IMPLEMENTED]`
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

### 2.8 Security & Authorization
- Destructive operations and dataset imports continue to require standard NestJS authentication (`SupabaseAuthGuard`) and Phase 0 security controls.
- Stored procedure executes with `security definer` under PostgreSQL RLS policies.
