# VectorHire

An AI-powered recruitment operating system built to automate the complete hiring workflow—from candidate ingestion to interview scheduling.

Instead of manually screening resumes, evaluating GitHub profiles, matching candidates against job descriptions, sending assessments, and scheduling interviews, VectorHire consolidates the entire recruitment pipeline into a single platform.

---

## Why I Built This

Modern hiring is fragmented.

Recruiters typically juggle multiple tools:

- Resume screening
- ATS software
- GitHub profile evaluation
- Technical assessments
- Email communication
- Calendar scheduling

VectorHire brings these workflows together into a unified AI-assisted platform that reduces repetitive recruiter effort while keeping humans in control of hiring decisions.

---

## What It Does

### Candidate Management

- Import candidates directly from CSV datasets
- Append or replace existing datasets
- Export candidate records
- Manage uploaded resumes
- Maintain candidate lifecycle

---

### Resume Intelligence

- Download resumes from Google Drive
- Parse PDF resumes automatically
- Extract education, skills, projects and experience
- Store structured candidate information

---

### AI Candidate Evaluation

Every candidate receives an AI-generated evaluation including:

- Overall AI Score
- Technical strengths
- Potential weaknesses
- Hiring recommendation
- Interview questions
- Recruiter-friendly summary

Evaluations are cached to avoid unnecessary AI requests.

---

### GitHub Intelligence

Candidates can also be evaluated beyond their resumes.

The GitHub Intelligence engine analyzes:

- Repository quality
- Programming languages
- Project diversity
- Portfolio maturity
- Open-source activity

The results are combined with resume analysis to give recruiters a broader understanding of technical ability.

---

### Job Description Matching

Recruiters can create job descriptions and instantly compare every candidate against them.

The matching engine provides:

- Match percentage
- Missing skills
- Relevant experience
- AI hiring recommendation

---

### Assessment Workflow

Recruiters can:

- Send assessment emails
- Track assessment status
- Upload assessment results
- Automatically update candidate scores

Assessment results become part of the overall hiring decision.

---

### Interview Scheduling

Candidates who qualify can be scheduled directly from the platform.

Features include:

- Google Calendar integration
- Google Meet generation
- Interview invitation emails
- Calendar synchronization

---

### Recruiter Dashboard

The dashboard provides a live overview of the hiring process:

- Candidate statistics
- Hiring funnel
- Assessment progress
- Interview pipeline
- Recruitment analytics

---

# Technology Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Fluent UI

## Backend

- Next.js API Routes
- Supabase
- PostgreSQL

## AI

- Google Gemini
- Prompt Engineering
- Explainable AI Evaluation

## Integrations

- GitHub REST API
- Google Drive API
- Gmail SMTP
- Google Calendar API

---

# Architecture

```text
Recruiter

        │

        ▼

Next.js Application

        │

        ▼

API Layer

        │

 ┌──────────────┬──────────────┬──────────────┐

 ▼              ▼              ▼

AI Engine   GitHub Engine   Resume Parser

        │

        ▼

Supabase Database

        │

        ▼

Google Drive
GitHub API
Gemini
Gmail SMTP
Google Calendar
```

---

# Recruitment Workflow

```
Candidate Upload
        │
        ▼
Resume Parsing
        │
        ▼
AI Evaluation
        │
        ▼
GitHub Analysis
        │
        ▼
Job Description Matching
        │
        ▼
Candidate Ranking
        │
        ▼
Assessment
        │
        ▼
Interview Scheduling
        │
        ▼
Google Calendar
        │
        ▼
Recruiter Dashboard
```

---

# Project Structure

```
app/
components/
lib/
supabase/
public/

├── AI Evaluation
├── GitHub Intelligence
├── Candidate Management
├── Interview Scheduling
├── Assessments
└── Analytics
```

---

# Running Locally

```bash
git clone <repository-url>

pnpm install

pnpm dev
```

Create a `.env.local` file containing the required API keys and Supabase credentials before running the application.

---

# Future Improvements

- Multi-model AI provider support
- Background job processing
- Recruiter collaboration
- Resume embeddings
- Semantic candidate search
- Multi-tenant organizations

---

## Author

**Harshit Mishra**

B.Tech Computer Science Engineering

Maharaja Agrasen Institute of Technology

Delhi, India
