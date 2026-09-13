# VectorHire Recruiter Dashboard & Command Center

## 1. Overview & Recruiter Workflow

The VectorHire Recruiter Command Center (`/dashboard`) is the central operational interface for technical talent acquisition teams. It aggregates persisted candidate intelligence, active recruitment pipelines, upcoming interview schedules, position matching statistics, and chronological timeline activity into a unified, high-efficiency dashboard.

```
                    ┌──────────────────────────────────────────────┐
                    │       VectorHire Recruiter Dashboard         │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴───────┬──────────────────┐
         │                  │                      │                  │
┌────────▼────────┐┌────────▼────────┐   ┌─────────▼────────┐┌────────▼────────┐
│  Top-Level KPIs ││ Attention Center│   │ 2-Column Command ││ Talent Analytics │
│  - Candidates   ││ - Pending Review│   │ - Interviews     ││ - Funnel Velocity│
│  - Pipeline     ││ - Today's Meets │   │ - Top Candidates ││ - Score Buckets  │
│  - Active Jobs  ││ - Dispatched    │   │ - Active Jobs    ││ - College Yield  │
│  - Interviews   ││ - Unevaluated   │   │ - Timeline Feed  │└──────────────────┘
└─────────────────┘└─────────────────┘   └──────────────────┘
```

---

## 2. Dashboard Information Architecture

### 2.1 Top-Level KPI Cards
All dashboard KPIs are derived strictly from persisted database records without synthetic formulas:
- **Total Candidates**: Total number of candidate records in the workspace pool.
- **Shortlisted Candidates**: Candidates transitioned to the `Shortlisted` stage.
- **Pending Review**: Candidates currently in `Applied`, `Reviewing`, or `Pending` status.
- **Average AI Score**: Deterministic arithmetic mean of completed AI Fit scores.
- **High Scorers (≥80%)**: Count of candidate profiles achieving strong suitability scores.
- **Top College**: Highest-volume educational institution across applicants.
- **Assessments Pending**: Candidates with status `Assessment Sent` awaiting submission.
- **Assessments Completed**: Candidates with status `Assessment Completed`.
- **Upcoming Interviews**: Future interviews with `status = 'scheduled'`.
- **Interviews This Week**: Scheduled sessions falling within a rolling 7-day window.
- **Offers Extended**: Candidates with status `Offer Extended`.
- **Hire Rate**: Percentage of candidates successfully transitioned to `Hired`.

### 2.2 Recruiter Action Center ("Needs Attention")
The Attention Center highlights critical action items derived from real workflow states:
1. **Pending Initial Review**: Fast-tracks unreviewed applications directly into `/candidates?status=applied`.
2. **Today's Scheduled Interviews**: Highlights sessions taking place today with candidate names, interviewers, and direct Google Meet buttons.
3. **Awaiting Interview Scheduling**: Identifies candidates marked `Interview Eligible` or `Shortlisted` who lack a future scheduled interview.
4. **Dispatched Assessments**: Monitors candidates undergoing technical assessments.
5. **Unevaluated Candidates**: Flags profiles that require AI intelligence evaluation.
6. **Truthful State Guarantee**: When no items require intervention, displays an explicit confirmation: *"All pipeline workflows are up to date."*

### 2.3 Command Center 2-Column Operational Grid

#### Left Column
- **Upcoming Interviews Widget**: Displays the next 5 upcoming interview sessions with candidate name, interview time, duration, interviewer name, direct Meet link, and link to the Candidate Workspace.
- **Priority Talent Snapshot**: Compact table displaying top candidates sorted deterministically by AI score. All signals (AI Fit, GitHub Score, CGPA, Test Code, Pipeline Status) are displayed independently without artificial composite weighting.

#### Right Column
- **Active Job Positions Widget**: Displays active positions, requirement snippets, creation dates, and direct links to execute or view AI candidate matching (`/job-descriptions/[id]`).
- **Recent Pipeline Activity Feed**: Live, chronological stream of candidate timeline events (`status_changed`, `ai_evaluated`, `interview_scheduled`, `interview_completed`, `assessment_sent`, `offer_sent`, `resume_parsed`, `github_analyzed`, `applied`, `jd_matched`) linking directly to individual Candidate Workspaces.

### 2.4 Talent Analytics & Yield
Preserves aggregate academic and scoring breakdowns:
- **Recruitment Funnel Velocity**: Stage conversion progression from Sourced/Applied to Hired.
- **AI Score Distribution**: Categorized bucket analysis (90–100, 80–89, 70–79, Below 70).
- **Top College Yield**: Conversion rates across academic pipelines.

---

## 3. Data Integrity & Non-Destructive Refresh

1. **Read-Only Dashboard Invocations**: Loading or refreshing the dashboard performs lightweight `GET` projections. It **never** automatically enqueues expensive background parsing, AI evaluations, or Redis jobs.
2. **Deterministic Refresh**: The "Refresh Pipeline" button refetches candidate lists, interview records, job descriptions, and timeline events concurrently via `Promise.all`.
3. **No Synthetic Ranking**: Candidate scores are presented independently. VectorHire never multiplies or arbitrarily blends AI Fit, GitHub, and CGPA scores into a synthetic ranking index.
