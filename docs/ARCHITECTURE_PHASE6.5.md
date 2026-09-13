# VectorHire Phase 6.5 Architecture & Data Flow

## 1. Architectural Guardrails & Principles

VectorHire Phase 6.5 enforces strict architectural integrity, consolidating existing candidate, job description, matching, interview, and communication features into a unified Recruiter Command Center without introducing redundant backend layers or synthetic entities.

```
Next.js App Router (React 19 / Fluent UI v9)
        │
        ▼
Next.js BFF / Proxy Routes (/api/candidates, /api/interviews, /api/job-descriptions, /api/timeline)
        │
        ▼
NestJS Backend Application Layer (Controllers, Services, Guards, Filters)
        │
        ▼
Domain & Application Services (CandidatesService, JobsService, MatchingService, InterviewsService, TimelineService, EmailService)
        │
        ▼
Framework-Independent Repositories (CandidateRepository, JobRepository, JobMatchRepository, InterviewRepository, TimelineRepository, EmailLogRepository)
        │
        ▼
Supabase / PostgreSQL (candidates, job_descriptions, job_matches, interviews, candidate_timeline, email_logs)

Heavy Operations / Async Pipelines:
NestJS -> QueueService -> BullMQ / Redis -> Workers (AiEvaluationWorker, ResumeWorker, GithubWorker, EmailWorker, DatasetWorker)
```

---

## 2. API & Endpoint Inventory

| Endpoint | Method | Service / Handler | Description |
|---|---|---|---|
| `/api/candidates` | GET | `getCandidates()`, `getCandidatesPaginated()` | Lists or paginates talent pool with multi-facet filters |
| `/api/candidates/[id]` | GET / PATCH | `getCandidateById()`, `updateCandidate()` | Fetches or updates individual candidate profile & status |
| `/api/interviews` | GET / POST | `getInterviews()`, `createInterview()` | Retrieves scheduled interviews or books new sessions |
| `/api/interviews/[id]` | PATCH | `updateInterviewStatus()` | Updates interview status (`completed`, `cancelled`) |
| `/api/job-descriptions` | GET / POST | `getJobDescriptions()`, `createJobDescription()` | Retrieves active job positions or creates new JD |
| `/api/job-matches` | GET | `getJobMatchesForJD()`, `getJobMatchesPaginated()` | Returns match scores, skill overlap, and metrics |
| `/api/job-matches/run` | POST | `batchEvaluateMatches()` | Enqueues/runs AI candidate matching against JD |
| `/api/timeline` | GET | `getRecentTimelineEvents()` | Returns chronological recent activity feed across candidates |
| `/api/v1/timeline/recent` | GET | `TimelineFeedController.getRecentTimeline()` | Backend NestJS endpoint for recent timeline stream |

---

## 3. Data Consistency & Metric Provenance

All numbers displayed across the VectorHire recruiter dashboard originate from verifiable domain entities:

1. **Candidate Counts & Statuses**: Directly queried from `public.candidates` table.
2. **Interview Schedules**: Derived from `public.interviews` where `scheduled_date` and `status` are evaluated against current UTC time.
3. **Active Job Positions**: Derived from `public.job_descriptions`.
4. **Matched Candidate Metrics**: Calculated in `findPaginatedByJobId` or `findByJobDescriptionId` within `SupabaseJobMatchRepository` against `public.job_matches`.
5. **Recent Activity**: Read from `public.candidate_timeline` joined with `public.candidates` on `candidate_id`.

---

## 4. Security & Access Control

1. **Candidate Isolation**: All candidate actions remain bounded by Candidate ID. URL parameter mutations cannot access unauthorized candidate records without valid tenant/server context.
2. **Authoritative Backend**: UI visibility toggles are backed by NestJS / Server-Side authentication verification (`verifyServerAuth`, `SupabaseAuthGuard`).
3. **No Secret Leakage**: `SUPABASE_SERVICE_ROLE_KEY` and API keys are strictly confined to server runtimes and never emitted to client bundles.
4. **Idempotent Timeline Logging**: Timeline logging operations are best-effort and non-blocking, ensuring main transactional workflows (e.g. status changes, interview bookings) complete safely even during transient logging faults.
