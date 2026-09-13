# VectorHire Phase 6.5 Product Acceptance & Journey Verification

## 1. Overview & Verification Scope

This document provides the deterministic verification checklist for the complete recruiter journey across VectorHire (Phases 6.1 through 6.5). All scenarios have been validated against the implementation.

---

## 2. Recruiter Journey Scenarios

### SCENARIO 1: Open Dashboard
- **Action**: Recruiter navigates to `/dashboard` (or root `/` which redirects to `/dashboard`).
- **Expected Outcome**:
  - Dashboard loads cleanly with header banner, top-level KPI metrics, Attention Center, Upcoming Interviews, Active Jobs, Recent Activity, and Priority Candidates.
  - No expensive background workers or AI jobs are triggered on page read.
  - KPIs truthfully reflect candidate counts and pipeline stages.
- **Verification Status**: **PASS**

### SCENARIO 2: Open Candidates Directory
- **Action**: Recruiter clicks "Candidates" in the navigation sidebar or dashboard header.
- **Expected Outcome**:
  - Candidate directory loads with multi-facet filters (Status, College, Min/Max AI Score), search input, and server-side pagination.
  - Bulk actions toolbar allows visible-only multi-selection and bulk status updates.
- **Verification Status**: **PASS**

### SCENARIO 3: Open Candidate Profile / Workspace
- **Action**: Recruiter clicks on a candidate name in the directory or dashboard table.
- **Expected Outcome**:
  - Navigates to `/candidates/[id]`.
  - Header displays candidate name, email, college, and status dropdown.
  - 5 Unified tabs (`Overview`, `Intelligence`, `Interviews`, `Communication`, `Timeline`) display candidate-specific data.
  - Intelligence signals (AI Fit score, GitHub analysis, Resume parsing) reflect persisted records without cross-candidate leakage.
- **Verification Status**: **PASS**

### SCENARIO 4: Change Candidate Status
- **Action**: Recruiter selects a new pipeline stage (e.g. `Shortlisted` or `Interview Eligible`) from the status dropdown.
- **Expected Outcome**:
  - `PATCH /api/candidates/[id]` persists the new status in the database.
  - Timeline records a `status_changed` event.
  - Dashboard KPI and Attention Center counts update accurately upon refresh.
- **Verification Status**: **PASS**

### SCENARIO 5: Open Job Descriptions & Matching
- **Action**: Recruiter navigates to `/job-descriptions` and selects an active job description.
- **Expected Outcome**:
  - Position requirements and target skills display clearly.
  - Top whole-dataset metrics bar displays Total Matched, High Matches (≥80%), and Average Match Score.
  - Matched candidates list displays match percentage, matched skills, missing skills, and explainable recommendations.
- **Verification Status**: **PASS**

### SCENARIO 6: Open Matched Candidate
- **Action**: Recruiter clicks on a matched candidate profile link in the job match card.
- **Expected Outcome**:
  - Navigates directly to `/candidates/[id]` preserving Candidate ID.
  - Recruiter can review full intelligence, interview history, and communication.
- **Verification Status**: **PASS**

### SCENARIO 7: Schedule Interview
- **Action**: Recruiter clicks "Schedule Interview" from the Candidate Workspace or `/interview-scheduling`.
- **Expected Outcome**:
  - Interviewer name, date, time, and duration are submitted via `POST /api/interviews`.
  - Interview record is created in `public.interviews`.
  - Google Meet link / meeting details appear in candidate interview tab and dashboard upcoming interviews widget.
  - Event `interview_scheduled` is appended to the candidate timeline.
- **Verification Status**: **PASS**

### SCENARIO 8: Send Communication (Assessment / Offer)
- **Action**: Recruiter triggers "Send Assessment" or "Send Offer" email drawer.
- **Expected Outcome**:
  - Enqueues email dispatch to BullMQ/Redis `email-processing-queue` via `POST /api/emails/send`.
  - Email log record is persisted with status `pending` / `sent`.
  - Timeline records `assessment_sent` or `offer_sent`.
- **Verification Status**: **PASS**

### SCENARIO 9: Refresh Dashboard / Workspace
- **Action**: Recruiter clicks "Refresh Pipeline" on the dashboard or "Refresh" on the Candidate Workspace.
- **Expected Outcome**:
  - Concurrently re-fetches latest persisted state across candidates, interviews, jobs, and timeline events.
  - Read-only operation: no AI models or heavy workers are implicitly invoked.
  - UI state updates seamlessly.
- **Verification Status**: **PASS**

---

## 3. Regression Test Verification Matrix

| Area | Scope | Result |
|---|---|---|
| Phase 6.2 | Candidate Directory, Search, Multi-Facet Filters, Bulk Status, Workspace Links | **PASS** |
| Phase 6.3 | Job Directory, Job Details, AI Matching Run/Refresh, Explainability Overlap, URL Filter State | **PASS** |
| Phase 6.4 | Candidate Intelligence, Resume Parsing, GitHub Analysis, AI Evaluation, Interviews, Email Logs, Timeline Feed | **PASS** |
| Phase 6.5 | Recruiter Command Center, Top KPIs, Attention Center, Upcoming Interviews, Active Jobs, Recent Activity, Priority Talent | **PASS** |
