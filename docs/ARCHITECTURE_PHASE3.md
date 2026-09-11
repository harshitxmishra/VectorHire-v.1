# VectorHire Architecture & Migration Document — Phase 3: Repository & Data Access Layer

## 1. Database Access Audit Inventory

| Domain | File | Table | Operation | Query Purpose | Used By |
|---|---|---|---|---|---|
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `insert` | Insert imported candidates | `insertCandidates`, CSV import |
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `select (*)` | Fetch all candidates sorted by AI score | `getCandidates`, `CandidatesService.findAll` |
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `select (*)` | Fetch single candidate by ID | `getCandidateById`, `CandidatesService.findOne` |
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `update` | Update candidate status | `updateCandidateStatus`, `CandidatesService.updateStatus` |
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `update` | Batch update test scores & status by email | `updateTestResultByEmail`, CSV score import |
| **Candidates** | `lib/services/candidate-service.ts` | `candidates` | `delete` | Delete candidate by ID | `deleteCandidate`, `CandidatesService.remove` |
| **Candidates** | `backend/src/ai/ai.service.ts` | `candidates` | `select` | Check cached AI evaluation | `AiService.evaluateCandidate` |
| **Candidates** | `backend/src/ai/ai.service.ts` | `candidates` | `update` | Persist AI evaluation & timestamp | `AiService.evaluateCandidate` |
| **Candidates** | `lib/services/github-service.ts` | `candidates` | `select` | Fetch GitHub cached analysis | `getOrAnalyzeGitHub` |
| **Candidates** | `lib/services/github-service.ts` | `candidates` | `update` | Persist GitHub analysis & score | `getOrAnalyzeGitHub` |
| **Candidates** | `lib/services/resume-service.ts` | `candidates` | `update` | Update resume text & parse status | `parseResumeForCandidate` |
| **Candidates** | `backend/src/email/email.service.ts` | `candidates` | `select` | Fetch candidate details for email batch | `EmailService.sendEmails` |
| **Candidates** | `backend/src/email/email.service.ts` | `candidates` | `update` | Update status after email dispatch | `EmailService.sendEmails` |
| **Candidates** | `backend/src/matching/matching.service.ts` | `candidates` | `select` | Fetch candidate data for JD match prompt | `MatchingService.evaluateCandidateMatch` |
| **Jobs** | `lib/services/job-description-service.ts` | `job_descriptions` | `select (*)` | Fetch all job descriptions | `getJobDescriptions`, `JobsService.findAll` |
| **Jobs** | `lib/services/job-description-service.ts` | `job_descriptions` | `insert` | Create new job description | `createJobDescription`, `JobsService.create` |
| **Jobs** | `lib/services/job-description-service.ts` | `job_descriptions` | `update` | Update job description by ID | `updateJobDescription`, `JobsService.update` |
| **Jobs** | `lib/services/job-description-service.ts` | `job_descriptions` | `delete` | Delete job description by ID | `deleteJobDescription`, `JobsService.remove` |
| **Jobs** | `backend/src/matching/matching.service.ts` | `job_descriptions` | `select` | Fetch JD requirements for AI match | `MatchingService.evaluateCandidateMatch` |
| **Interviews** | `lib/services/interview-service.ts` | `interviews` | `select (*, candidates)` | Fetch all interviews joined with candidates | `getInterviews`, `InterviewsService.findAll` |
| **Interviews** | `lib/services/interview-service.ts` | `interviews` | `insert` | Create scheduled interview record | `createInterview`, `InterviewsService.create` |
| **Interviews** | `lib/services/interview-service.ts` | `interviews` | `update` | Update interview status (completed/cancelled) | `updateInterviewStatus`, `InterviewsService.updateStatus` |
| **Timeline** | `lib/services/timeline-service.ts` | `candidate_timeline` | `insert` | Record candidate timeline events | `logTimelineEvent`, all workflow domains |
| **Timeline** | `lib/services/timeline-service.ts` | `candidate_timeline` | `select (*)` | Fetch chronological timeline for candidate | `getTimeline`, `TimelineService.findByCandidateId` |
| **Timeline** | `lib/services/timeline-service.ts` | `candidate_timeline` | `select (candidate_id)` | Query candidates with specific event type | `getDistinctCandidateIdsForEvent` |
| **Matching** | `lib/services/job-match-service.ts` | `job_match_results` | `select (*)` | Fetch match results for job description | `getJobMatchesForJD`, `MatchingService.getMatchesForJD` |
| **Matching** | `lib/services/job-match-service.ts` | `job_match_results` | `select (candidate_id, match_percentage)` | Compute best match score per candidate | `getBestMatchPerCandidate`, `MatchingService.getBestMatches` |
| **Matching** | `lib/services/job-match-service.ts` | `job_match_results` | `upsert` | Upsert AI match evaluation | `upsertJobMatch`, `MatchingService.evaluateCandidateMatch` |
| **Email** | `lib/services/email-service.ts` | `email_logs` | `insert` | Create pending email log | `sendCandidateEmail` |
| **Email** | `lib/services/email-service.ts` | `email_logs` | `update` | Update email log (sent / failed) | `sendCandidateEmail` |
| **Email** | `backend/src/email/email.service.ts` | `email_logs` | `select` | Deduplicate sent emails | `EmailService.sendEmails` |
| **Datasets** | `lib/services/dataset-service.ts` | `dataset_uploads` | `select (*)` | List dataset upload records | `getDatasetUploads`, `DatasetsService.getDatasets` |
| **Datasets** | `lib/services/dataset-service.ts` | `dataset_uploads` | `insert` | Record new dataset upload entry | `recordDatasetUpload`, `DatasetsService.recordUpload` |
| **Datasets** | `lib/services/dataset-service.ts` | `candidates` | `delete` | Purge all candidates on replace mode | `deleteAllCandidates`, `DatasetsService.clearCandidates` |

---

## 2. Target Repository Architecture & Boundaries

```
NestJS Controller
      ↓
NestJS Application Service
      ↓
Repository Interface (e.g. CandidateRepository)
      ↓
Concrete Repository Implementation (e.g. SupabaseCandidateRepository)
      ↓
Supabase Client / PostgreSQL
```

### Planned Repositories

| Repository | Domain | Location | Primary Responsibilities |
|---|---|---|---|
| `CandidateRepository` | Candidates | `backend/src/candidates/repositories/` | Candidate CRUD, status updates, test score batch mapping, AI evaluation cache & resume updates |
| `JobRepository` | Jobs | `backend/src/jobs/repositories/` | Job description CRUD |
| `InterviewRepository` | Interviews | `backend/src/interviews/repositories/` | Interview CRUD, status transitions, calendar event ID linking |
| `TimelineRepository` | Timeline | `backend/src/timeline/repositories/` | Candidate timeline event logging & chronological retrieval |
| `JobMatchRepository` | Matching | `backend/src/matching/repositories/` | JD match retrieval, best matches, evaluation upserts |
| `EmailLogRepository` | Email | `backend/src/email/repositories/` | Email log creation, status tracking, duplicate dispatch detection |
| `DatasetRepository` | Datasets | `backend/src/datasets/repositories/` | Dataset upload tracking and candidate bulk wipe |

---

## 3. Incremental Migration Plan

1. **Domain 1: Candidates (`CandidateRepository`)** (Representative Slice)
   - Define `CandidateRepository` interface & `CANDIDATE_REPOSITORY` token.
   - Implement `SupabaseCandidateRepository`.
   - Update `CandidatesService`, `candidate-service.ts`, `AiService`, `ResumeService`, and `GithubService`.
   - Add unit tests for `SupabaseCandidateRepository` and update `CandidatesService` tests to mock repository.
   - Verify build and tests, commit checkpoint: `refactor(backend): introduce candidate repository abstraction`.
2. **Domain 2: Jobs (`JobRepository`)**
   - Define `JobRepository` interface & `SupabaseJobRepository`.
   - Update `JobsService` & `job-description-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate job persistence to repository`.
3. **Domain 3: Interviews (`InterviewRepository`)**
   - Define `InterviewRepository` interface & `SupabaseInterviewRepository`.
   - Update `InterviewsService` & `interview-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate interview persistence to repository`.
4. **Domain 4: Timeline (`TimelineRepository`)**
   - Define `TimelineRepository` interface & `SupabaseTimelineRepository`.
   - Update `TimelineService` & `timeline-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate timeline persistence to repository`.
5. **Domain 5: Job Matching (`JobMatchRepository`)**
   - Define `JobMatchRepository` interface & `SupabaseJobMatchRepository`.
   - Update `MatchingService` & `job-match-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate job match persistence to repository`.
6. **Domain 6: Email Logs (`EmailLogRepository`)**
   - Define `EmailLogRepository` interface & `SupabaseEmailLogRepository`.
   - Update `EmailService` & `email-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate email log persistence to repository`.
7. **Domain 7: Datasets (`DatasetRepository`)**
   - Define `DatasetRepository` interface & `SupabaseDatasetRepository`.
   - Update `DatasetsService` & `dataset-service.ts`.
   - Add tests, verify build and tests, commit checkpoint: `refactor(backend): migrate dataset persistence to repository`.
8. **ORM Decision Evaluation & Report**:
   - Create `docs/REPOSITORY_AND_ORM_DECISION.md`.
   - Run full test suite & production builds.
   - Stop and provide Phase 3 Final Report.
