# VectorHire Candidate Intelligence & Communication Guide (Phase 6.4)

## 1. Unified Recruiter Workspace Overview
Phase 6.4 consolidates candidate intelligence, interviews, email communications, and timeline auditing into a unified, high-performance workspace located at `/candidates/[id]`.

The recruiter workspace flows seamlessly:
```
CANDIDATE
    ↓
UNIFIED INTELLIGENCE STRIP (AI Score, GitHub Score, Assessment Score, Academic CGPA)
    ↓
INTELLIGENCE DEEP-DIVE (Resume, GitHub Portfolio, AI Recommendation)
    ↓
STATUS / RECRUITER DECISION (PIPELINE_STAGES Check Constraint)
    ↓
INTERVIEW SCHEDULING (Synchronous scheduling, calendar meet link, status management)
    ↓
COMMUNICATION (Assessment / Offer email dispatch & candidate email logs)
    ↓
ACTIVITY TIMELINE (Chronological domain audit spine)
```

---

## 2. Five Unified Navigation Tabs

### Tab 1: Overview
- **Candidate Header**: Full name, email, college, branch, initials avatar badge, pipeline stage dropdown (`PIPELINE_STAGES`), quick action buttons (`Schedule Interview`, `Send Assessment`, `Refresh`).
- **Intelligence Metric Strip**: 4 curated metrics (`AI Fit Score`, `GitHub Score`, `Assessment Score`, `CGPA / Academic`) directly derived from verified domain fields with color-coded confidence thresholds.
- **Candidate Overview Details**: Institution, Degree, CGPA, Learning Agility (Test LA), Coding Score (Test Code), Ingestion timestamp, Highlighted Project, and Research/Publications.
- **Snapshots**: High-level summaries of Resume parsing state, GitHub maturity verdict, and AI recommendation with direct jump links to detailed views.
- **Action Trigger Bar**: Explicit trigger buttons for AI Evaluation (with force re-run option), Resume Parsing, and GitHub Analysis with live bounded async status indicators.

### Tab 2: Intelligence
- **Resume Intelligence**: Parsing status (`not_applicable`, `pending`, `success`, `failed`), parsing timestamp, source file link, and structured extracted text display preserving document line breaks in a dark monospace viewer.
- **GitHub Technical Insights**: Quantitative score (0–100), engineering maturity verdict, technical summary, top languages badges, repository & commit highlights, and direct link to strongest repository.
- **AI Candidate Evaluation**: Evaluation score, overall recruiter recommendation, comprehensive evaluation summary, key strengths bulleted list, potential gaps / areas to probe, and suggested technical interview questions.

### Tab 3: Interviews
- **Synchronous Domain Operations**: Interview creation and status updates execute synchronously via domain services and `InterviewRepository` (`/api/interviews`), preserving real-time recruiter response.
- **Candidate Interviews List**: Scheduled date, duration, interviewer name, Google Meet join link, status badge (`scheduled`, `completed`, `cancelled`), and instant status actions (`Mark Completed`, `Cancel`).
- **Scheduling Drawer**: Inline slide-out drawer to schedule interviews with candidate-scoped pre-population, validation, and automated timeline logging.

### Tab 4: Communication
- **Email Dispatch Actions**:
  - **Assessment Email**: Configurable modal with Assessment Title, Deadline, URL, and Recruiter signature.
  - **Offer Email**: Employment offer confirmation with recruiter signature.
- **Async Job & Queue Integration**: Dispatches via QueueService / EmailWorker when processed asynchronously and provides immediate candidate email logs.
- **Candidate Email History**: History table listing recipient, email type (`assessment`, `interview`, `offer`), status (`sent`, `pending`, `failed`), error messages, and sent timestamps via `/api/candidates/[id]/emails`.

### Tab 5: Activity Timeline
- **Chronological Audit Stream**: Displays all candidate events (`applied`, `status_changed`, `resume_parsed`, `github_analyzed`, `ai_evaluated`, `interview_scheduled`, `interview_completed`, `interview_cancelled`, `assessment_sent`, `interview_sent`, `offer_sent`, `jd_matched`) with exact timestamps and descriptive context.

---

## 3. Strict Architectural Rules & Contracts

1. **Source of Truth for Fields**:
   - Only persisted and verified fields from `Candidate`, `ResumeService`, `GithubService`, and `AiService` are rendered. No synthetic metrics or artificial composite formulas are calculated.
2. **Pipeline Stages & Candidate Status**:
   - Governed by database CHECK constraint and `PIPELINE_STAGES` constant (`'Applied'`, `'Reviewing'`, `'Shortlisted'`, `'Assessment Sent'`, `'Assessment Completed'`, `'Interview Eligible'`, `'Interview Scheduled'`, `'Interview Completed'`, `'Offer Extended'`, `'Rejected'`, `'Hired'`).
3. **Server-Side Authorization Boundary**:
   - Candidate-scoped endpoints (`/interviews?candidateId=X`, `/emails/candidate/:candidateId`, `/candidates/:id/timeline`) verify candidate existence and authorization server-side, preventing unauthorized cross-candidate data leakage.
4. **EmailLogRepository Delegation**:
   - `EmailService` strictly queries through `EmailLogRepository.findByCandidateId` without bypassing the abstraction.
5. **Precise Refresh Semantics**:
   - The `Refresh` button re-fetches candidate profile, interviews, email logs, and timeline state; it does not trigger expensive AI, GitHub, Resume, or Email re-runs.
