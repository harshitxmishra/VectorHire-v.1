# VectorHire Architecture — Phase 6.3: Job & Matching Experience

## 1. Architectural Summary

Phase 6.3 delivers a high-performance, modular Job Matching and Recruiter Evaluation workflow connecting Next.js 16 frontend pages to NestJS backend domain services and PostgreSQL/Supabase database repositories.

```
+-----------------------------------------------------------------------------------+
| Next.js Frontend                                                                  |
|   /job-descriptions         --> Job Directory with Search & Navigation            |
|   /job-descriptions/[id]    --> Job Workspace with Metrics, Search, Filters,     |
|                                 Sorting, Pagination, Explainability Drawer        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| API Routes / BFF Proxy Layer                                                      |
|   GET  /api/job-descriptions/[id]                                                 |
|   GET  /api/job-matches?jobDescriptionId=2&page=1...                              |
|   POST /api/job-matches/run                                                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| NestJS Modular Backend                                                            |
|   JobsModule       --> JobsController (GET /jobs/:id), JobsService                |
|   MatchingModule   --> MatchingController (GET /matching/jd/:id/paginated,        |
|                        POST /matching/jd/:id/run), MatchingService                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Repositories & Data Access Layer                                                  |
|   JobRepository        --> SupabaseJobRepository                                  |
|   JobMatchRepository   --> SupabaseJobMatchRepository                             |
|                            - Explicit Projection (MATCH_DIRECTORY_COLUMNS)        |
|                            - Whole-Job Metrics Aggregation                        |
|                            - PostgREST Foreign-Table Relational Search            |
|                            - Deterministic Secondary Sort (id ASC)                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PostgreSQL Database (Supabase)                                                    |
|   job_descriptions, candidates, job_match_results, candidate_timeline             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Design & Performance Principles

1. **Explicit Projections Only**:
   All database queries explicitly select exact required columns (`MATCH_DIRECTORY_COLUMNS`), completely avoiding unbounded `select('*')`.

2. **Accurate Whole-Dataset Metrics (Two-Stage Query)**:
   Summary metrics (`totalMatches`, `highMatchCount >= 80`, `averageMatchScore`) represent the entire match dataset for the job rather than being derived from the current paginated page. This is executed as a clean two-stage database operation (lightweight aggregate select for metrics + paginated relational retrieval) rather than requiring complex single-roundtrip RPC functions.

3. **Relational Search & Join Semantics**:
   Candidate searching is bounded to candidate properties (`full_name`, `email`, `college`, `branch`) using `candidate:candidates!inner(...)` and PostgREST `foreignTable: 'candidates'` filtering. *(Classification: D — verified via unit/repository test suites and query structure).*

4. **Disambiguated State Machine**:
   Empty states are determined by evaluating `candidateCount`, `totalMatchesForJob`, and `total` records returned, preventing false empty messages.

5. **URL-Backed State Synchronization**:
   All filter, search, sort, and pagination state is preserved in URL query parameters with automatic page reset to 1 on filter changes.

6. **Synchronous In-Flight Feedback**:
   During AI evaluation, action buttons lock with clear loading spinners without displaying fabricated progress percentages.

