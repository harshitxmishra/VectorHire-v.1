# VectorHire Architecture & Migration Document — Phase 2: Domain & Service Migration

## 1. Phase 2 Migration Inventory & Status Tracking

| Legacy Route | NestJS Route | Domain | Frontend Migrated | Tests | Status |
|---|---|---|---|---|---|
| `/api/candidates` (GET, DELETE) | `/api/v1/candidates` | Candidates | Yes | Unit + E2E | **Verified** |
| `/api/candidates/[id]` (GET, PATCH, DELETE) | `/api/v1/candidates/:id` | Candidates | Yes | Unit + E2E | **Verified** |
| `/api/health` | `/api/v1/health` | Health | N/A (Public probe) | Unit | **Verified** |
| `/api/job-descriptions` (GET, POST) | `/api/v1/jobs` | Jobs | Yes | Unit + App | **Verified** |
| `/api/job-descriptions/[id]` (PUT, DELETE) | `/api/v1/jobs/:id` | Jobs | Yes | Unit + App | **Verified** |
| `/api/interviews` (GET, POST) | `/api/v1/interviews` | Interviews | Yes | Unit + App | **Verified** |
| `/api/interviews/[id]` (PATCH) | `/api/v1/interviews/:id` | Interviews | Yes | Unit + App | **Verified** |
| `/api/candidates/[id]/timeline` (GET) | `/api/v1/candidates/:id/timeline` | Timeline | Yes | Unit + App | **Verified** |
| `/api/job-matches` (GET) | `/api/v1/matching` | Matching | Yes | Unit + App | **Verified** |
| `/api/ai/match` (POST) | `/api/v1/matching/evaluate` | Matching | Yes | Unit + App | **Verified** |
| `/api/ai/resume-match` (POST) | `/api/v1/matching/resume` | Matching | Pending | Pending | **Pending** |
| `/api/ai/evaluate` (POST) | `/api/v1/ai/evaluate` | AI Evaluation | Yes | Unit + App | **Verified** |
| `/api/assessments/queue` (POST) | `/api/v1/ai/assessments/queue` | AI Evaluation | Pending | Pending | **Pending** |
| `/api/emails/send` (POST) | `/api/v1/emails/send` | Email | Yes | Unit + App | **Verified** |
| `/api/candidates/[id]/parse-resume` (POST) | `/api/v1/candidates/:id/parse-resume` | Resume | Yes | Unit + App | **Verified** |
| `/api/ai/github` (POST) | `/api/v1/ai/github` | GitHub | Yes | Unit + App | **Verified** |
| `/api/ai/github/search` (POST) | `/api/v1/ai/github/search` | GitHub | Yes | Unit + App | **Verified** |
| `/api/datasets` (GET) | `/api/v1/datasets` | Datasets | Yes | Unit + App | **Verified** |
| `/api/candidates/import-test-results` (POST) | Legacy Next.js route | Datasets / CSV | Coexisting | Coexisting | **Legacy / Deferred** |
| `/api/candidates/import` (POST) | Legacy Next.js route | Datasets / CSV | Coexisting | Coexisting | **Legacy / Deferred** |
| `/api/candidates/export` (GET) | Legacy Next.js route | Datasets / CSV | Coexisting | Coexisting | **Legacy / Deferred** |
| `/api/auth/google/*` | Legacy Next.js OAuth | Auth | Coexisting | Coexisting | **Legacy / Deferred** |

---

## 2. Migration Execution Order
1. **Domain 1: Jobs** (`JobsModule` $\rightarrow$ `/api/v1/jobs`)
2. **Domain 2: Interviews** (`InterviewsModule` $\rightarrow$ `/api/v1/interviews`)
3. **Domain 3: Timeline** (`TimelineModule` $\rightarrow$ `/api/v1/candidates/:id/timeline`)
4. **Domain 4: Matching & AI** (`MatchingModule` $\rightarrow$ `/api/v1/matching`, `AiModule` $\rightarrow$ `/api/v1/ai`)
5. **Domain 5: Email** (`EmailModule` $\rightarrow$ `/api/v1/emails`)
6. **Domain 6: Resume & GitHub** (`ResumeModule` $\rightarrow$ `/api/v1/candidates/:id/parse-resume`, `GithubModule` $\rightarrow$ `/api/v1/ai/github`)
7. **Domain 7: Datasets** (`DatasetsModule` $\rightarrow$ `/api/v1/datasets`)
