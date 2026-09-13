# VectorHire

An AI-assisted recruitment platform that consolidates candidate management, resume parsing, GitHub technical profiling, AI candidate evaluation, job matching, interview scheduling, and pipeline activity tracking into a unified recruiter workflow.

## Overview

Hiring workflows are frequently fragmented across disparate tools for applicant tracking, resume screening, code repository evaluation, candidate scoring, email communication, and interview scheduling. This separation introduces manual overhead, inconsistent scoring criteria, and delayed feedback loops.

VectorHire integrates these workflows into a single modular architecture. Recruiters can manage applicant pipelines, inspect extracted resume data and GitHub technical metrics, generate structured AI fit evaluations, match candidates against job descriptions with aggregate scoring, schedule interviews via Google Calendar, dispatch communications with audit logging, and track hiring progress through a live command center dashboard.

## Features

- **Candidate Management:** Server-side indexed SQL pagination, multi-attribute filtering (status, college, score ranges, text search), and visible-only bulk status updates.
- **Resume Intelligence:** Automated extraction of candidate skills, education, work experience, and project summaries from resumes.
- **GitHub Technical Profiling:** Repository analysis capturing language distributions, commit activity, repository quality, and portfolio metrics.
- **AI Candidate Evaluation:** Structured LLM assessments generating fit scores, technical strengths, potential weaknesses, recruiter summaries, and tailored interview questions.
- **Job Matching:** Requirements-based candidate matching with unpaginated global aggregate metrics (total matches, high matches $\ge 80\%$, average score) and relational search.
- **Interview Management:** Candidate-scoped scheduling with Google Calendar synchronization, Google Meet link generation, and canonical status progression.
- **Email Communication:** Templated email dispatch for technical assessments, interview invitations, and offers, with delivery logging and deduplication guards.
- **Timeline & Activity Stream:** Canonical chronological audit logging across all candidate lifecycle events.
- **Recruiter Dashboard:** Command center featuring an Attention Center for pending reviews and upcoming interviews, 12 calculated domain KPIs, active job links, and a live activity feed.

## Architecture

VectorHire is built as a modular monolith with a decoupled Next.js frontend, a NestJS backend gateway, framework-independent repositories, and asynchronous background worker queues:

```
Next.js Frontend (BFF / API Routes)
       │
       ▼
NestJS Backend Gateway
       │
       ├───────────────────────────────┐
       ▼                               ▼
PostgreSQL (Supabase)           BullMQ + Redis
                                       │
                                       ▼
                               Background Workers
                         (AI, Resume, GitHub, Email, Dataset)
```

- **Modular Monolith:** Decoupled Next.js 16 App Router frontend interacting with a NestJS backend API gateway.
- **Repository Pattern:** Framework-independent repository interfaces (`lib/repositories/`) backed by Supabase PostgreSQL.
- **Asynchronous Processing:** Redis and BullMQ queues offload compute-heavy AI evaluation, resume parsing, GitHub analysis, bulk dataset imports, and email delivery.
- **Security & Reliability:** JWT authentication, candidate-scoped IDOR authorization checks, SSRF validation, Helmet security headers, rate limiting, and dedicated health probes (`/health/live`, `/health/ready`).

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Fluent UI, Tailwind CSS |
| **Backend** | NestJS 11, TypeScript, Express |
| **Database** | PostgreSQL via Supabase |
| **Queues & Caching** | BullMQ 6, Redis |
| **AI Integration** | Google GenAI SDK (`@google/genai`), OpenAI SDK |
| **Integrations** | Googleapis (Calendar & Drive), Nodemailer (SMTP) |
| **Testing** | Vitest, Supertest |
| **Tooling & CI** | Docker, GitHub Actions |

## Workflow

```
Candidate Ingestion → Intelligence (Resume & GitHub) → AI Evaluation → Job Matching → Recruiter Review → Interview Scheduling → Communication → Dashboard Tracking
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/harshitxmishra/VectorHire-v.1.git
cd VectorHire-v.1
```

### 2. Install Dependencies

```bash
pnpm install
npm --prefix backend install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Configure the required variables in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and `backend/.env` (`PORT=3001`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `GEMINI_API_KEY`).

### 4. Database Setup

Apply the SQL migrations located in `supabase/migrations/` sequentially in your Supabase SQL editor.

### 5. Start the Application

```bash
# Terminal 1: Backend Gateway
npm run dev:backend

# Terminal 2: Next.js Frontend
pnpm dev
```

The frontend runs at `http://localhost:3000` and the backend gateway at `http://localhost:3001`.

## Testing

The automated test suite covers schema validation, domain services, repository contracts, BullMQ workers, and cross-service integration lifecycles:

```bash
npm test                  # Root unit and utility tests
npm run test:backend      # Backend unit and worker tests
npm run test:integration  # End-to-end integration tests
pnpm build                # Next.js production build verification
```

## Deployment

- **Frontend:** Vercel (Next.js standalone runtime with `output: 'standalone'`).
- **Backend:** Node.js 22 LTS container or managed Node runtime.
- **Database:** Supabase Managed PostgreSQL.
- **Queues:** Redis instance (local or hosted).
- **Containers:** Dockerfile and `docker-compose.yml` configurations are available for containerized deployment.

## Documentation

- [FINAL_PRODUCT_ACCEPTANCE.md](file:///docs/FINAL_PRODUCT_ACCEPTANCE.md) — Product acceptance, architecture audit, and sign-off report.
- [PRODUCTION_RUNBOOK.md](file:///docs/PRODUCTION_RUNBOOK.md) — Operational monitoring, health probes, alerts, and triage runbook.
- [DEPLOYMENT_CHECKLIST.md](file:///docs/DEPLOYMENT_CHECKLIST.md) — Pre-flight production deployment checklist.
- [INTEGRATION_TESTING.md](file:///docs/INTEGRATION_TESTING.md) — Integration test suite documentation and boundary contracts.
- [CANDIDATE_MANAGEMENT.md](file:///docs/CANDIDATE_MANAGEMENT.md) — Candidate directory pagination, search, and bulk status workflows.
- [JOB_MATCHING.md](file:///docs/JOB_MATCHING.md) — Job description creation, matching engine, and aggregate metrics.

## Contributing

1. Create a feature branch from `main` (`git checkout -b feat/your-feature-name`).
2. Ensure all tests and typechecks pass (`npx tsc --noEmit && npm run test:all && npm run build:backend && pnpm build`).
3. Submit a pull request with conventional commit messages and a clear summary of changes.
