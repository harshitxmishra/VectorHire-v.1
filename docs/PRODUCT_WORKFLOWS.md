# VectorHire — Product Workflows Specification

This document maps the exact end-to-end control flows, asynchronous handshakes, data persistence layers, and recruiter interaction points across the VectorHire platform.

---

## Workflow A: Candidate Ingestion & Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/candidates)
    participant Controller as NestJS / Next API (/api/candidates)
    participant Service as CandidatesService
    participant Repo as CandidateRepository
    participant DB as PostgreSQL (Supabase)
    participant Timeline as TimelineService

    Recruiter->>Frontend: Submit Candidate Form / CSV Import
    Frontend->>Controller: POST /api/candidates or /api/v1/datasets/import
    Controller->>Service: createCandidate(dto) / importDataset(file)
    Service->>Repo: create(candidateRecord)
    Repo->>DB: INSERT INTO candidates (id: bigint, status: 'applied')
    DB-->>Repo: Candidate record with numeric ID
    Service->>Timeline: createEvent(candidateId, 'applied')
    Timeline->>DB: INSERT INTO candidate_timeline
    Repo-->>Service: Candidate Entity
    Service-->>Controller: DTO
    Controller-->>Frontend: 201 Created / 202 Accepted
    Frontend-->>Recruiter: Render Candidate in Table with Status Badge
```

### Traceability:
- **Frontend Entry**: `app/candidates/page.tsx`, `components/candidates/AddCandidateModal.tsx`, `components/candidates/UploadModal.tsx`
- **Backend API**: `backend/src/candidates/candidates.controller.ts`, `app/api/candidates/route.ts`
- **Domain Service**: `lib/services/candidate-service.ts`, `backend/src/candidates/candidates.service.ts`
- **Repository Interface**: `lib/repositories/candidate-repository.ts`
- **Repository Implementation**: `lib/repositories/supabase-candidate-repository.ts`
- **Database Tables**: `candidates` (numeric `id bigint`), `candidate_timeline`, `dataset_uploads`
- **Database Logic**: Uses PostgreSQL `import_dataset_atomic` function (migration `0007_atomic_dataset_import.sql`) for atomic batch replacement.
- **Initial Status**: `applied`

---

## Workflow B: Job Description Lifecycle & Candidate Matching

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/job-descriptions)
    participant Controller as Jobs & Matching Controller
    participant Service as MatchingService
    participant MatchRepo as JobMatchRepository
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Click "Match Candidates" for Job ID
    Frontend->>Controller: POST /api/v1/matching/evaluate { candidateId, jobDescriptionId }
    Controller->>Service: evaluateCandidateMatch(dto) (Synchronous Execution)
    Service->>DB: SELECT candidate and job_description
    Service->>Service: Compute Multi-Dimensional Compatibility Scores
    Service->>MatchRepo: upsert(matchRecord)
    MatchRepo->>DB: INSERT INTO job_match_results ... ON CONFLICT (candidate_id, job_description_id) DO UPDATE
    DB-->>MatchRepo: Persisted Match Record
    Service-->>Controller: MatchResult (score, matched_skills, missing_skills, recommendation)
    Controller-->>Frontend: 200 OK with Match Result
    Frontend-->>Recruiter: Display Compatibility % and Top Strengths/Gaps
```

### Traceability:
- **Frontend Entry**: `app/job-descriptions/page.tsx`, `components/jobs/MatchCandidatesModal.tsx`
- **Backend API**: `backend/src/jobs/jobs.controller.ts`, `backend/src/matching/matching.controller.ts`
- **Domain Service**: `lib/services/matching-service.ts`, `backend/src/matching/matching.service.ts`
- **Repository**: `lib/repositories/supabase-job-match-repository.ts`
- **Database Tables**: `job_descriptions`, `job_match_results`, `candidates`
- **Execution Mode**: **Direct Synchronous Execution** via REST endpoint with immediate database upsert.

---

## Workflow C: Resume Processing & Intelligence

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/candidates/[id])
    participant Controller as Resume Controller
    participant Queue as BullMQ (resume-processing-queue)
    participant Worker as ResumeWorker
    participant SSRF as SSRF Validator
    participant Service as ResumeService
    participant Repo as CandidateRepository
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Trigger "Parse Resume"
    Frontend->>Controller: POST /api/v1/candidates/:id/parse-resume
    Controller->>Queue: addJob('resume:parse', { candidateId, resumeUrl })
    Controller-->>Frontend: 202 Accepted { jobId, status: 'pending' }
    
    Queue->>Worker: process(job)
    Worker->>SSRF: validateUrl(resumeUrl)
    SSRF-->>Worker: Safe URL confirmed
    Worker->>Service: parseResumeFromUrl(safeUrl)
    Service->>Service: Download & Extract Text / Skills / Experience
    Service->>Repo: update(candidateId, { resume_text, parsing_status: 'success' })
    Repo->>DB: UPDATE candidates SET resume_text = ..., parsing_status = 'success'
    Worker->>DB: INSERT INTO candidate_timeline (event_type: 'resume_parsed')
    
    loop Polling (every 1000ms)
        Frontend->>Controller: GET /api/v1/queue/status/:jobId
        Controller-->>Frontend: { status: 'completed' }
    end
    Frontend->>Frontend: Refresh Candidate Profile View
```

### Traceability:
- **SSRF Gatekeeper**: `lib/utils/ssrf-protection.ts` (blocks private IP ranges, cloud metadata endpoints, loopback).
- **Drive Handler**: `lib/utils/google-drive.ts` (converts share URLs to direct streamable binaries).
- **Queue/Worker**: `backend/src/queue/workers/resume.worker.ts`, `backend/src/queue/queue.service.ts`.
- **Concurrency**: 5 concurrent worker threads.

---

## Workflow D: GitHub Intelligence Analysis

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/github-insights)
    participant Controller as Candidates Controller
    participant Queue as BullMQ (github-processing-queue)
    participant Worker as GithubWorker
    participant Service as GithubService
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Request GitHub Insight
    Frontend->>Controller: POST /api/v1/candidates/:id/analyze-github
    Controller->>Queue: addJob('github:analyze', { candidateId, githubUrl, force: false })
    Controller-->>Frontend: 202 Accepted { jobId }
    
    Queue->>Worker: process(job)
    Worker->>Service: analyzeProfile(githubUsername)
    alt Cache Valid (< 7 days old & !force)
        Service-->>Worker: Return Cached Analysis
    else Cache Stale / Force
        Service->>Service: Fetch Repos, Languages, Commit Stats from GitHub API
        Service->>DB: UPDATE candidates SET github_score = ..., github_analysis = ..., github_last_analyzed = NOW()
        Worker->>DB: INSERT INTO candidate_timeline (event_type: 'github_analyzed')
    end
    
    Frontend->>Controller: Poll status until 'completed'
    Frontend-->>Recruiter: Display Technical Score, Top Languages, & Velocity
```

### Traceability:
- **Cache TTL**: 7 Days (`github_last_analyzed`).
- **Worker**: `backend/src/queue/workers/github.worker.ts`.
- **Timeline Event**: `github_analyzed`.

---

## Workflow E: Multi-Provider AI Candidate Evaluation

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/ai-evaluation)
    participant Controller as AI Controller
    participant Queue as BullMQ (ai-evaluation-queue)
    participant Worker as AiEvaluationWorker
    participant AIClient as lib/ai/client.ts
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Run AI Candidate Evaluation
    Frontend->>Controller: POST /api/v1/ai/evaluate { candidateId, jobDescriptionId }
    Controller->>Queue: addJob('ai:evaluate', payload)
    Controller-->>Frontend: 202 Accepted { jobId }

    Queue->>Worker: process(job)
    Worker->>AIClient: evaluateCandidate(candidateText, jobRequirements)
    
    alt Primary Provider (Gemini) Success
        AIClient-->>Worker: Evaluation JSON (Score, Strengths, Gaps, Summary)
    else Gemini Fails (Rate Limit / Timeout)
        AIClient->>AIClient: Fallback to Grok / Groq / OpenRouter with Backoff
        AIClient-->>Worker: Evaluation JSON
    end
    
    Worker->>DB: UPDATE candidates SET ai_score = ..., ai_evaluation = ..., status = 'reviewed'
    Worker->>DB: INSERT INTO candidate_timeline (event_type: 'ai_evaluated')
    
    Frontend->>Controller: Poll status until 'completed'
    Frontend-->>Recruiter: Show Score Gauge, Breakdown Summary & Status Badge
```

### Traceability:
- **AI Abstraction**: `lib/ai/client.ts` with exponential backoff and max 2 retries per provider.
- **Queue/Worker**: `backend/src/queue/workers/ai-evaluation.worker.ts`.
- **Status Change**: Updates candidate status in database.

---

## Workflow F: Assessment Invitation & Score Recording

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/assessments)
    participant Controller as Email / Assessment Controller
    participant Queue as BullMQ (email-processing-queue)
    participant Worker as EmailWorker
    participant EmailProvider as Nodemailer (Gmail SMTP)
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Send Assessment Invitation
    Frontend->>Controller: POST /api/v1/emails/send { templateId: 'assessment', candidateIds: [...] }
    Controller->>Queue: addJob('email:send', payload)
    Controller-->>Frontend: 202 Accepted { jobId }

    Queue->>Worker: process(job)
    Worker->>EmailProvider: sendMail({ to: candidateEmail, subject: 'Technical Assessment' })
    EmailProvider-->>Worker: SMTP 250 OK
    Worker->>DB: INSERT INTO email_logs (status: 'sent')
    Worker->>DB: UPDATE candidates SET status = 'assessment sent'
    Worker->>DB: INSERT INTO candidate_timeline (event_type: 'assessment_sent')

    Note over Recruiter, DB: Assessment Completed & Graded
    Recruiter->>Frontend: Record Assessment Score (e.g. 85/100)
    Frontend->>DB: UPDATE candidates SET test_code = 85, status = 'interview eligible'
    Frontend->>DB: INSERT INTO candidate_timeline (event_type: 'assessment_completed')
    Frontend-->>Recruiter: Candidate moved to "Interview Eligible" column
```

### Traceability:
- **Worker**: `backend/src/queue/workers/email.worker.ts`.
- **Status Transition**: `assessment sent` → `assessment completed` / `interview eligible` (if score ≥ 60).

---

## Workflow G: Interview Scheduling & Status Flow

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (/interview-scheduling)
    participant Controller as Interviews Controller
    participant Service as InterviewsService
    participant GCal as GoogleCalendarService
    participant Repo as InterviewRepository
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Select Slot, Candidate, and Interviewer
    Frontend->>Controller: POST /api/interviews { candidateId, scheduledAt, durationMinutes }
    Controller->>Service: scheduleInterview(dto)
    Service->>GCal: createCalendarEvent(candidateEmail, scheduledAt)
    GCal-->>Service: { meetingLink: 'https://meet.google.com/xyz', eventId: 'gcal-123' }
    Service->>Repo: create({ candidate_id, scheduled_at, meeting_link, status: 'scheduled' })
    Repo->>DB: INSERT INTO interviews
    Service->>DB: UPDATE candidates SET status = 'interview scheduled'
    Service->>DB: INSERT INTO candidate_timeline (event_type: 'interview_scheduled')
    Service-->>Controller: Interview Entity
    Controller-->>Frontend: 201 Created with Meet Link
    Frontend-->>Recruiter: Display Scheduled Event in Calendar View
```

### Traceability:
- **Google Calendar Integration**: `lib/services/calendar-service.ts`.
- **Repository**: `lib/repositories/supabase-interview-repository.ts`.
- **Status Progression**: `interview eligible` → `interview scheduled` → `interview completed`.

---

## Workflow H: Recruiter Communication & Offer Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as Next.js UI (Candidate Details)
    participant Controller as Email Controller
    participant Queue as BullMQ (email-processing-queue)
    participant Worker as EmailWorker
    participant EmailProvider as Nodemailer (Gmail SMTP)
    participant DB as PostgreSQL (Supabase)

    Recruiter->>Frontend: Click "Extend Job Offer"
    Frontend->>Controller: POST /api/v1/emails/send { templateId: 'offer', candidateIds: [candidateId] }
    Controller->>Queue: addJob('email:send', payload)
    Controller-->>Frontend: 202 Accepted
    
    Queue->>Worker: process(job)
    Worker->>EmailProvider: sendMail(offerTemplate)
    EmailProvider-->>Worker: SMTP 250 OK
    Worker->>DB: INSERT INTO email_logs (status: 'sent', email_type: 'offer')
    Worker->>DB: UPDATE candidates SET status = 'offer extended'
    Worker->>DB: INSERT INTO candidate_timeline (event_type: 'offer_sent')
    
    Frontend-->>Recruiter: Status reflects "offer extended", Email Log & Timeline updated
```

### Traceability:
- **Email Log Table**: `email_logs` (`id`, `candidate_id`, `recipient`, `subject`, `email_type`, `status`, `sent_at`).
- **Terminal Statuses**: `offer extended` → `hired` / `rejected`.
