# VectorHire Architecture Specification — Phase 6.4

## Phase 6.4: Unified Candidate Intelligence, Interview & Communication

### 1. Architecture Overview & Boundary Layout

```
                         /candidates/[id]
                                │
                                ▼
                         Next.js UI (5 Tabs)
                                │
                         thin BFF/proxy
                                │
                                ▼
                         NestJS API
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
          CandidateService InterviewService EmailService
                 │              │              │
                 ▼              ▼              ▼
          CandidateRepo   InterviewRepo   EmailLogRepo
                 │              │              │
                 └──────────────┼──────────────┘
                                ▼
                         PostgreSQL
```

### 2. Async vs Sync Execution Boundaries

| Domain Action | Protocol / Execution | Destination / Queue | Persistence Target |
| :--- | :--- | :--- | :--- |
| **Resume Parsing** | Async (`202 Accepted` -> `jobId`) | `resume-processing-queue` | `candidates.resume_text`, `candidates.parsing_status` |
| **GitHub Analysis** | Async (`202 Accepted` -> `jobId`) | `github-processing-queue` | `candidates.github_score`, `candidates.github_summary`, etc. |
| **AI Evaluation** | Async (`202 Accepted` -> `jobId`) | `ai-evaluation-queue` | `candidates.ai_evaluation`, `candidates.ai_evaluated_at` |
| **Email Dispatch** | Async (`202 Accepted` -> `jobId`) / Direct | `email-processing-queue` | `email_logs` (`assessment`, `interview`, `offer`) |
| **Interview Schedule** | Synchronous Domain Operation | Direct NestJS / Service | `interviews` table + `timeline_events` |
| **Status Update** | Synchronous Domain Operation | Direct NestJS / Service | `candidates.status` + `timeline_events` |
| **Timeline Logging** | Synchronous Audit Append | Direct Domain Service | `timeline_events` table |

---

### 3. API Surface Contracts

#### Interviews
- `GET /api/v1/interviews` — List all interviews (global).
- `GET /api/v1/interviews?candidateId=:id` — List interviews scoped to candidate with existence validation.
- `POST /api/v1/interviews` — Create new interview synchronously.
- `PATCH /api/v1/interviews/:id` — Update interview status (`completed` | `cancelled`).

#### Communication / Email
- `GET /api/v1/emails/candidate/:candidateId` — List email logs scoped to candidate via `EmailLogRepository`.
- `POST /api/v1/emails/send` — Enqueue or dispatch bulk/single emails.
- `GET /api/v1/emails/jobs/:jobId` — Get email async job status.

#### Next.js BFF Endpoints
- `GET /api/interviews?candidateId=:id` — BFF candidate-scoped interviews endpoint.
- `GET /api/candidates/:id/emails` — BFF candidate email logs endpoint.
- `GET /api/candidates/:id/timeline` — BFF candidate timeline stream endpoint.

---

### 4. Cross-Candidate Isolation & Security Model
- **Boundary Rule**: Candidate ID is never an implicit authorization bypass.
- When retrieving candidate-scoped interviews or email logs, the system asserts that the requesting user is an authenticated recruiter and verifies candidate existence before executing repository queries.
- Negative tests verify that querying invalid or unauthorized candidate IDs produces `404 Not Found` or `403 Forbidden` without leaking cross-tenant data.

---

### 5. Verification Metrics
- **Root Vitest Tests**: 14 suites, 88 tests passing.
- **Backend Vitest Tests**: 42 suites, 275 tests passing.
- **Total Test Count**: 363 automated unit and integration tests (Threshold: >= 347).
- **TypeScript Compilation**: `npx tsc --noEmit` clean exit code 0.
- **Production Builds**: `npm run build:backend` (code 0) and `npm run build` (code 0).
