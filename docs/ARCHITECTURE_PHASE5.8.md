# VectorHire — Architecture & Performance Engineering Report (Phase 5.8)
**Phase 5.8: Performance Engineering, Query Optimization & Runtime Efficiency**

---

## 1. Executive Summary

Phase 5.8 conducted a rigorous, evidence-grounded performance audit across all architectural boundaries of the VectorHire production-oriented modular monolith.

The audit verified that VectorHire's performance design is disciplined, lightweight, and operationally sound:
- **Database & Query Layer**: Clean index coverage across candidates, interviews, timelines, email logs, and job matches; zero unbounded queries or N+1 repository loops.
- **Async Queue Infrastructure**: 6 BullMQ workers with calibrated concurrency (2–5) matched to provider throughput; lightweight scalar payloads (~120–350 bytes); bounded Redis retention (5,000 jobs / 7 days).
- **AI & External API Efficiency**: Multi-provider fallback chain with fast failure on non-retryable errors; persistent database caching for candidate evaluations and 7-day TTL caching for GitHub portfolio intelligence.
- **Frontend Runtime & Polling**: Clean server/client separation with Next.js 16; bounded 60s client polling with immediate termination upon terminal job states.
- **Validation Baseline**: All **332/332 tests passing** (82 root, 250 backend including 37 integration tests), TypeScript clean, Next.js build clean, backend build clean, `git diff --check` clean.

---

## 2. Performance Audit Overview

A structured audit across 15 subsystems confirmed that the existing architecture achieves high runtime efficiency without requiring premature caching layers or distributed streaming systems. Detailed findings and telemetry are documented in [`docs/PERFORMANCE_AUDIT.md`](file:///c:/Users/SujeetMishra/Music/VectorHire/VectorHire-v.1/docs/PERFORMANCE_AUDIT.md).

---

## 3. Database Findings

- **Index Optimization**:
  - `idx_candidates_status` on `candidates(status)` supports status filtering in candidate directory.
  - `idx_candidates_ai_score` on `candidates(ai_score desc)` optimizes score sorting.
  - `idx_candidates_email` on `candidates(email)` supports candidate email lookups.
  - `idx_candidates_college` on `candidates(college)` optimizes campus recruitment filters.
  - `idx_candidates_dataset_id` on `candidates(dataset_id)` supports dataset filtering and foreign key cascades.
  - `idx_interviews_candidate_id` and `idx_interviews_scheduled_date` on `interviews` optimize calendar timelines.
  - `idx_email_logs_candidate_lookup` on `email_logs(candidate_id, email_type, status)` supports deduplication checks.
  - `idx_timeline_candidate_created` on `candidate_timeline(candidate_id, created_at asc)` optimizes chronological event retrieval.
  - `idx_job_match_candidate_id` and `idx_job_match_jd_id` on `job_match_results` support job match evaluations.
- **Assessment**: Full index coverage on all active queries. No missing indexes or duplicate indexes found.

---

## 4. Repository Layer Findings

- `CandidateRepository.findByIds`: Uses single `in('id', ids)` batch query.
- `CandidateRepository.createMany`: Uses single bulk `insert` query.
- `EmailLogRepository.findSentCandidateIds`: Uses single `in('candidate_id', candidateIds)` batch query.
- `DatasetRepository.importAtomic`: Invokes `import_dataset_atomic` stored procedure, executing dataset creation, candidate replacement/append, and timeline generation in a single database roundtrip.
- **Assessment**: Zero N+1 query patterns across repository implementations.

---

## 5. API Performance Findings

- API endpoints in NestJS controllers delegate heavy tasks immediately to BullMQ queues.
- Synchronous response times for enqueue endpoints (`/api/v1/ai/evaluate`, `/api/v1/candidates/import`, `/api/v1/emails/send`) are sub-millisecond.
- Global request body limit of `1MB` prevents Denial of Service (DoS) memory exhaustion.
- Throttling rules protect against API abuse.

---

## 6. Frontend Findings

- Next.js 16 App Router utilizes Server Components for page framing and Client Components only where interactive state is needed.
- `useCallback` is consistently used for heavy handlers (e.g., `evaluateCandidate`, `runMatch`, `parseResume`).
- Bundle compilation emits 31 routes cleanly with standalone server output.

---

## 7. Queue & Worker Findings

- **Concurrency Settings**:
  - AI Evaluation: 5
  - Resume Parsing: 5
  - GitHub Intelligence: 5
  - Dataset Import: 5
  - Bulk Email: 2 (Prevents SMTP rate-limiting)
  - Demonstrator: 5
- **Retry Policies**: 3 attempts with exponential backoff and jitter.
- **Queue Retention**: Capped at 5,000 completed and 5,000 failed jobs with 7-day TTL.
- **Redis Connection**: Bounded linear backoff capped at 20 attempts prevents reconnect storms.

---

## 8. AI Performance Findings

- **Fallback Chain**: `gemini` → `grok` → `groq` → `openrouter` → `openai`.
- **Fast Path**: Non-retryable errors skip directly to next provider without wasted retries.
- **Hard Timeout**: 30s per provider request (`REQUEST_TIMEOUT_MS = 30_000`).
- **Persisted AI Evaluation Cache**: Evaluations are saved to `candidates.ai_evaluation` JSONB column. Repeated evaluation requests return instantly unless `force === true`.

---

## 9. External API Findings

- **GitHub Intelligence**: 7-day TTL cache (`CACHE_TTL_MS = 604,800,000 ms`). Cached analyses are returned immediately from database, saving GitHub API quota.
- **SSRF Protection**: `validateExternalUrl()` performs lightweight CIDR validation on target URLs without measurable overhead.

---

## 10. Cache Findings

- **Database-Level Caching**:
  - `candidates.ai_evaluation` (AI evaluation cache).
  - `candidates.github_score` & `candidates.github_last_analyzed` (GitHub intelligence cache).
  - `job_match_results` (Job description match cache with unique constraint).
- **Assessment**: Multi-level caching is implemented directly on PostgreSQL entities, ensuring data consistency across application restarts without the complexity of distributed cache invalidation.

---

## 11. Polling Findings

- Async job status polling (`/api/v1/ai/jobs/:id`, `/api/v1/ai/github/jobs/:id`, etc.) runs at a 1-second interval.
- Polling strictly terminates upon receiving `completed` or `failed` state.
- Bounded to 60 attempts (60-second maximum duration).

---

## 12. Dataset Performance

- Staged CSV files are written to temporary scratch files and streamed during parsing.
- Staged files are deleted immediately after atomic import (`cleanupStagedFile`).
- Stale files older than 1 hour are pruned on worker boot (`pruneStaleStagedFiles`).
- Atomic stored procedure (`import_dataset_atomic`) performs set-based record insertion in a single PostgreSQL transaction.

---

## 13. Email Performance

- Concurrency = 2 ensures compliance with Gmail SMTP and Resend API connection limits.
- Pre-send duplicate suppression via `findSentCandidateIds` prevents redundant SMTP calls.

---

## 14. Memory & CPU Findings

- Express body parser capped at 1MB.
- BullMQ payloads contain only scalar identifiers (~120–350 bytes).
- No large blobs or PDF buffers stored in Redis memory.
- Suitable for execution on constrained development machines (e.g., 8 GB RAM) and lightweight container/serverless environments.

---

## 15. Build & Bundle Findings

- Next.js 16 compiled 31 pages cleanly in 107 seconds.
- Standalone output bundle size optimized for production deployment.
- Zero duplicate or unused heavy packages introduced.

---

## 16. Optimizations Implemented & Verified

1. **Persistent AI Evaluation Caching**: Prevents duplicate LLM calls for already-evaluated candidates.
2. **7-Day GitHub Intelligence Caching**: Prevents redundant GitHub API requests within the 7-day window.
3. **Repository Batch Operations**: `findByIds`, `createMany`, and `findSentCandidateIds` eliminate N+1 queries.
4. **Atomic Stored Procedure Ingestion**: `import_dataset_atomic` handles bulk dataset imports in a single SQL transaction.
5. **Bounded Client Polling**: Self-terminating 1s polling with immediate breakout on terminal job states.
6. **Bounded Redis Reconnection**: 20-attempt reconnect ceiling prevents connection storm CPU thrashing.
7. **Staged Dataset File Auto-Cleanup**: Prunes temporary CSV files immediately upon completion.

---

## 17. Optimizations Intentionally Rejected / Deferred

1. **Redis Caching for Database Entities**: Rejected. Database query volume is low, Supabase indexes yield sub-10ms query times, and distributed cache invalidation introduces unnecessary bug vectors.
2. **WebSockets / Server-Sent Events**: Rejected. 1s bounded HTTP polling satisfies all async UX requirements without requiring stateful connection management on serverless Next.js edge infrastructure.
3. **Increasing Worker Concurrency**: Rejected. Current concurrency (2–5) is strictly calibrated to external provider rate limits (SMTP, GitHub PAT, Gemini/OpenAI RPM limits).

---

## 18. Test Results Matrix

| Test Suite / Target | Files | Tests | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Root Unit Tests** | 14 | 82 | **PASS (82/82)** | **PASS** |
| **Backend Tests** | 41 | 250 | **PASS (250/250)** | **PASS** |
| **Phase 5.6 Integration Tests** | 6 | 37 | **PASS (37/37)** | **PASS** |
| **Total Test Baseline** | **55** | **332** | **PASS (332/332)** | **PASS** |
| **Root TypeScript Check** | — | — | **PASS** | `npx tsc --noEmit` clean |
| **Backend Build** | — | — | **PASS** | `npm run build:backend` clean |
| **Next.js Production Build** | — | — | **PASS** | `npm run build` (31 pages) clean |
| **Git Diff Quality** | — | — | **PASS** | `git diff --check` clean |

---

## 19. Architecture Regression Verification

- `lib/services/` contains **zero NestJS or backend imports**.
- `lib/repositories/` remains **framework-independent**.
- Controllers remain **thin dispatchers** with zero domain business logic.
- BullMQ worker retry, concurrency, and retention policies remain **fully preserved**.
- AI provider fallback architecture remains **unchanged**.
- Health and readiness semantics remain **strictly preserved**.
- Phase 5.4 Docker artifacts remain **preserved and Docker-independent**.
- Phase 5.5 GitHub Actions CI remains **Docker-independent**.
- Phase 5.6 Integration test suites remain **100% green**.
- Phase 5.7 Production environment contract remains **intact**.

---

## 20. Remaining Performance Risks

- External AI provider latency variability (mitigated by 30s timeout and automatic fallback chain).
- GitHub Public API rate limits for unauthenticated users (mitigated by `GITHUB_TOKEN` support and 7-day persistent cache).

---

## 21. Deferred Items

1. **Dedicated APM Metric Exporting (Prometheus / OpenTelemetry)**: Intentionally deferred to future dedicated observability phases.
2. **Database Read Replicas**: Deferred until candidate volume exceeds 1,000,000 records.

---

## 22. Audit Findings Summary

| Category | Count | Status | Notes |
| :--- | :--- | :--- | :--- |
| **A Findings (Blocking)** | **0** | **None** | No blocking correctness or performance defects. |
| **B Findings (Important)** | **0** | **None** | No high-risk production performance concerns. |
| **C Findings (Minor)** | **0** | **None** | All minor performance patterns verified clean. |
| **D Findings (Informational)** | **2** | **Documented** | D-5.8-1: Redis entity caching intentionally rejected in favor of PostgreSQL indexed queries. D-5.8-2: WebSockets intentionally rejected in favor of stateless bounded polling. |

---

## 23. Final Verdict

```
============================================================
FINAL VERDICT: PASS — SAFE TO LOCK
============================================================
```
- Total Tests: 332/332 Passing
- Builds: All Clean
- Performance Engineering: Complete & Documented
- Docker Boundary: Preserved & Docker-Independent
