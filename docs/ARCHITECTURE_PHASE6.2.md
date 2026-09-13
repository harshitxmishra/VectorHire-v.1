# VectorHire — Phase 6.2 Architecture Report: Candidate Management & Recruiter Workflow

**Date:** September 2026  
**Status:** COMPLETE & VERIFIED  
**Final Verdict:** PASS — SAFE TO LOCK  

---

## 1. Executive Summary

Phase 6.2 upgraded the candidate management capabilities of VectorHire into an integrated, performant recruiter workflow. Following the Phase 6.1 audit, Phase 6.2 implemented server-side search, multi-facet filtering, sort allowlists with deterministic secondary ordering, scalable directory projection pagination, URL-backed state synchronization, visible-only candidate selection, bulk status updates via `PATCH /candidates/bulk-status`, a unified candidate detail page (`/candidates/[id]`), and conditional timeline logging.

All architectural boundaries (pure domain services, abstract repository interfaces, NestJS controller DTOs, BullMQ async queues) were strictly preserved.

---

## 2. Architecture & Layered Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router UI                         │
│         (/candidates, /candidates/[id] with URL State Persistence)      │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │ REST (JWT Auth / Correlation) │
                    ▼                               ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       Next.js API Routes (CRUD)       │ │  NestJS Modular Monolith API │
│ (/api/candidates, /candidates/[id],   │ │  (QueryCandidatesDto,        │
│  /api/candidates/bulk-status)         │ │   BulkUpdateStatusDto)       │
└───────────────────┬───────────────────┘ └──────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CandidatesService (lib/services)                    │
│     (getCandidatesPaginated, bulkUpdateCandidateStatus, getById)       │
└───────────────────┬────────────────────────────────────────────────────┘
                    │ Clean Domain Parameters (CandidateFilters)
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            CandidateRepository & SupabaseCandidateRepository           │
│    (findPaginated [Explicit Projection], updateStatusMany, findById)   │
└───────────────────┬────────────────────────────────────────────────────┘
                    │ Single-Roundtrip SQL with count: exact
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL Database                       │
│    (candidates [CHECK check_candidates_status], candidate_timeline)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Architectural Decisions & Optimizations

1. **Explicit Directory DB Projection**:
   Directory queries select only `id, full_name, email, college, branch, status, ai_score, test_code, test_la, resume_url, github, created_at` via `CANDIDATE_DIRECTORY_COLUMNS`, avoiding heavy resume text/evaluation blobs on list views.
2. **Single-Roundtrip Pagination & Count**:
   Leverages Supabase `{ count: 'exact' }` in `findPaginated` to retrieve rows and total record counts in a single database roundtrip.
3. **Deterministic Sorting**:
   All sorting uses an allowlisted field (`ai_score`, `created_at`, `full_name`, `test_code`, `id`) and appends `.order('id', { ascending: true })` to prevent pagination jitter.
4. **URL Query State Synchronization**:
   Search, filters, sort, page, and limit are stored in the URL query string (`?search=...&status=...&page=...`), supporting browser history, bookmarking, and link sharing.
5. **Automatic Pagination Reset**:
   Any modification to search or filter inputs automatically resets `page = 1`.
6. **Visible-Only Selection**:
   Checkbox multi-selection explicitly operates on currently visible page items to avoid unintentional mutations across unseen candidates.
7. **Conditional Timeline Events**:
   `status_changed` events are emitted only when `oldStatus !== newStatus`, preventing audit spam on idempotent bulk operations.
8. **Pure Presentation Detail View (`/candidates/[id]`)**:
   Aggregates existing resume, GitHub, AI evaluation, and timeline records without introducing speculative AI engines or redundant backend services.

---

## 4. Verification Matrix

```
============================================================
TEST SUITE EXECUTION SUMMARY
============================================================
Root Test Suite:           84 passed (14 test files)
Backend Test Suite:       252 passed (41 test files)
  - Integration Subset:    37 passed (6 test files)
------------------------------------------------------------
Total Test Count:         336 passed (55 test files, 0 failed)
TypeScript Check:         0 errors (npx tsc --noEmit)
Backend Build:            Clean (dist output generated)
Next.js Production Build: Clean (All routes compiled)
Git Diff Check:           Clean (0 unstaged whitespace / syntax errors)
============================================================
```

---

## 5. Final Verdict

```
============================================================
                     FINAL VERDICT
                 PASS — SAFE TO LOCK
============================================================
```
