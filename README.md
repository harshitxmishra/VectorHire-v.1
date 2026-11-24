# VectorHire

An Autonomous Agentic Technical Evaluation & Outbound Sourcing Engine built with Next.js 16, NestJS, Supabase PostgreSQL with `pgvector`, Redis/BullMQ distributed workers, and Google Gemini GenAI.

VectorHire shifts technical recruiting from passive applicant tracking into an autonomous, code-grounded intelligence platform. It features deep GitHub repository interrogation via bounded ReAct tool use, a 3-agent adversarial hiring committee debate workflow, real-time Server-Sent Events (SSE) streaming traces, a Human-in-the-Loop (HITL) outbound sourcer, cryptographic HMAC-signed offer portals, RFC 5545 `.ics` calendar scheduling, and Terraform-managed AWS cloud infrastructure.

---

## Key Highlights & Capabilities

- **Code-Level "Repo Interrogation" ReAct Agent:** 4 typed tools (`list_repo_tree`, `read_file_chunk`, `get_recent_prs`, `check_test_coverage`) bounded to $\le 5$ iterations per candidate. Bounded to 150-line chunks to conserve token budget; autonomously selects the top 2 architectural files (e.g. workers, auth, connection pools, API routes) and generates line-specific interview questions citing exact file paths and line ranges (e.g., `L42–L68`).
- **Adversarial 3-Agent "Hiring Committee":** Replaces single-shot scoring with a structured debate pattern:
  - **Advocate Agent:** Argues *for* hiring, citing code evidence, concurrency abstractions, and steep learning curves.
  - **Skeptic (Principal Engineer) Agent:** Cross-examines claims against actual commit histories, test ratios, and architectural edge cases.
  - **Hiring Manager (Synthesizer) Agent:** Calibrates arguments against target Job Description (JD) rubrics into a calibrated verdict (`STRONG_HIRE | LEAN_HIRE | LEAN_NO_HIRE | NO_HIRE`) and $0\text{--}100$ score, emitting a turn-by-turn debate transcript and skill verification matrix (`VERIFIED_IN_CODE | RESUME_ONLY | CONTRADICTED | MISSING`).
- **Live-Streaming "Agent Brain" UI:** Server-Sent Events (SSE) endpoint (`/api/candidates/[id]/evaluate/stream`) streaming real-time tool execution traces, ms latency badges, and agent turns. Rendered in an interactive `AgentBrainPanel` with live terminal timeline, side-by-side committee debate cards, and 1-click copyable interview prep questions.
- **Autonomous Human-in-the-Loop (HITL) Outbound Sourcer:** Queries GitHub Search API for active developers matching target JD tech stacks, performs architectural pre-screening, drafts hyper-personalized cold outreach emails citing exact candidate repositories, and queues prospects into `PENDING_HUMAN_APPROVAL` with strict gates preventing automated email dispatch.
- **Cryptographic HMAC-Signed Offer Portals:** Generates tamper-evident offer links (`/offer/[token]`) signed via HMAC-SHA256 (`OFFER_SIGNING_SECRET`). Supports candidate digital acceptance/rejection with decline reasons and automated S3 PDF document archiving with pre-signed download URLs.
- **Dual Calendar Synchronization:** Google Calendar API integration with Google Meet link generation alongside an RFC 5545 iCalendar (`.ics`) endpoint (`/api/interviews/[id]/calendar.ics`) with timezone handling and alarm triggers for cross-client compatibility (Apple Calendar, Outlook, Google).
- **pgvector Semantic Search & Caching:** 768-dimensional vector embeddings for resumes and JD requirements with a cosine distance RPC (`match_candidates_to_job`). Content-hash SHA-256 caching layer delivering sub-5ms repeat evaluation retrieval.
- **511 Automated Vitest Tests:** Complete 3-tier testing pyramid (174 root unit/integration tests + 287 backend unit tests + 50 backend integration tests) verifying 100% of domain lifecycles, ReAct bounds, debate calibration, and HITL gates with deterministic mocked payloads.
- **Cloud Infrastructure (AWS + Terraform + Vercel + Supabase):** Terraform configurations (`infra/terraform/`) provisioning private S3 document buckets with AES-256 SSE encryption, least-privilege IAM policies/roles, EC2 worker instances, and security groups.

---

## System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │                Next.js 16 Frontend (BFF)               │
                                    │  - Live Streaming "Agent Brain" UI (SSE)               │
                                    │  - HITL Outbound Sourcing Dashboard (/sourcing)        │
                                    │  - Candidate Management & Kanban Pipeline              │
                                    │  - HMAC-Signed Offer Letter Portal (/offer/[token])    │
                                    └───────────────┬────────────────────────┬───────────────┘
                                                    │                        │
                          REST / Server-Sent Events │                        │ S3 Presigned URLs
                                                    ▼                        ▼
┌───────────────────────────────────────────────────────────┐      ┌─────────────────────────┐
│                    NestJS API Gateway                     │      │      AWS S3 Bucket      │
│  - ReAct Repo Interrogator (4 Typed GitHub Tools)         │      │  - Encrypted Resumes    │
│  - 3-Agent Hiring Committee (Advocate/Skeptic/HM)         │      │  - Generated Offer PDFs │
│  - HMAC-SHA256 Token Signer & SSRF Validator              │      └─────────────────────────┘
│  - RFC 5545 .ics Calendar Generator & Google Calendar API │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   PostgreSQL (Supabase)   │   │       Redis + BullMQ      │
│  - pgvector (768-dim)     │   │  - Distributed Queues     │
│  - SHA-256 Eval Cache     │   │  - Concurrency & Retries  │
│  - RLS Policies & Traces  │   │  - Background Workers     │
└───────────────────────────┘   └─────────────┬─────────────┘
                                              ▼
                                ┌───────────────────────────┐
                                │    Background Workers     │
                                │  - AI Evaluation Worker   │
                                │  - GitHub Analysis Worker │
                                │  - Resume Parser Worker   │
                                │  - Email Dispatch Worker  │
                                │  - Dataset Import Worker  │
                                └───────────────────────────┘
```

---

## Core Components

### 1. Code-Level "Repo Interrogation" ReAct Agent
- **Implementation:** `lib/services/repo-interrogator.ts`
- **Tools:**
  - `list_repo_tree(owner, repo)`: Filters out `node_modules/`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `cargo.lock`), binaries, and build artifacts (`dist/`, `.next/`).
  - `read_file_chunk(owner, repo, path, startLine, endLine)`: Targeted source code inspection capped at 150 lines per slice.
  - `get_recent_prs(owner, repo)`: Gathers merged PRs, PR bodies, and code review comment density.
  - `check_test_coverage(owner, repo)`: Identifies test frameworks (Vitest, Jest, Pytest, Go) and CI configurations to calculate test-to-source ratios.
- **Output:** Structured inspection summaries and 3–5 line-specific technical interview questions referencing exact file paths and line numbers.

### 2. Adversarial 3-Agent Hiring Committee
- **Implementation:** `lib/services/hiring-committee.ts` & `backend/src/ai/ai.service.ts`
- **Workflow:**
  1. **Advocate Turn:** Identifies architectural strengths, clean code abstractions, and steep learning velocity.
  2. **Skeptic Turn:** Cross-examines resume claims against verified commits, tests, and potential architectural anti-patterns.
  3. **Hiring Manager Turn:** Synthesizes the debate into a calibrated verdict (`STRONG_HIRE`, `LEAN_HIRE`, `LEAN_NO_HIRE`, `NO_HIRE`), calibrated score (0–100), and claim verification matrix (`VERIFIED_IN_CODE`, `RESUME_ONLY`, `CONTRADICTED`, `MISSING`).
- **Caching:** SHA-256 content hashing of candidate profile and repository tree guarantees sub-5ms repeat retrieval.

### 3. Live-Streaming Agent Brain UI
- **Implementation:** `app/api/candidates/[id]/evaluate/stream/route.ts` & `components/ai/AgentBrainPanel.tsx`
- **Features:**
  - Server-Sent Events (SSE) streaming typed events: `tool_start`, `tool_complete`, `agent_turn`, `cache_hit`, `evaluation_complete`, `error`.
  - Terminal-style execution timeline showing tool invocation latencies in milliseconds.
  - Threaded debate transcript with agent identity badges and evidence citations.
  - Tabbed code viewer displaying inspected files and 1-click copyable interview prep questions.

### 4. Human-in-the-Loop (HITL) Outbound Sourcer
- **Implementation:** `lib/services/sourcer-agent.ts` & `app/sourcing/page.tsx`
- **Capabilities:**
  - Targets active developers on GitHub based on language, seniority, and required skills extracted from any Job Description.
  - Executes automated code pre-screening and drafts personalized cold emails citing specific candidate repos and architecture choices.
  - Recruiter Approval Queue with actions: **Approve & Send Outreach** (with editable draft), **Reject**, or **Import to Candidate Pipeline**.
  - Strict safety guarantee: zero emails dispatched without explicit human sign-off.

### 5. HMAC-Signed Offer Portals & .ics Scheduling
- **Implementation:** `app/offer/[token]/page.tsx`, `app/api/offers/`, & `app/api/interviews/[id]/calendar.ics/route.ts`
- **Capabilities:**
  - Cryptographically signed offer URLs using HMAC-SHA256 (`OFFER_SIGNING_SECRET`).
  - Dynamic PDF generation uploaded to AWS S3 with signed, expiring download URLs.
  - Standard RFC 5545 iCalendar (`.ics`) file generation featuring timezone compliance and custom alarm triggers.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Microsoft Fluent UI v9, Tailwind CSS |
| **Backend Gateway** | NestJS 11, Express, TypeScript, class-validator, Helmet, Throttler |
| **AI & LLM Orchestration**| Google Gemini GenAI SDK (`@google/genai`), OpenAI SDK, ReAct Tool Calling |
| **Database & Search** | PostgreSQL via Supabase, `pgvector` (768-dim embeddings), Row-Level Security (RLS) |
| **Queues & Caching** | Redis, BullMQ 6 (5 background workers, exponential backoff, DLQ) |
| **Object Storage** | AWS S3 (`@aws-sdk/client-s3`), presigned URLs, SSE-AES256 |
| **Cloud & IaC** | Terraform 1.7 (AWS S3, EC2, IAM, Security Groups), Docker, Docker Compose |
| **Integrations** | GitHub REST/GraphQL APIs, Googleapis (Calendar & Drive), Nodemailer (SMTP) |
| **Testing** | Vitest 4, Supertest, 511 automated unit & integration tests |
| **CI/CD** | GitHub Actions (Terraform validation, multi-suite test runner, Next.js build, Docker build) |

---

## Automated Test Pyramid (511 Tests)

VectorHire enforces a comprehensive automated test battery covering unit, service, worker, and cross-tier integration contracts:

```
                  ┌──────────────────────────────┐
                  │   Backend Integration Tests  │  50 Tests (Vitest)
                  │   - Migration Chain & Idempotency
                  │   - Service-to-Repository Wire
                  │   - End-to-End Candidate Flow│
                  ├──────────────────────────────┴────────────────┐
                  │              Backend Unit Tests               │  287 Tests (NestJS Vitest)
                  │  - Queue Service & BullMQ Workers (AI, Gh, Em)│
                  │  - Auth Guards, IDOR & SSRF Validators        │
                  │  - Structured Logging & Health Controllers    │
                  ├───────────────────────────────────────────────┴────────────────┐
                  │                 Root Unit & Domain Tests                       │  174 Tests (Vitest)
                  │  - ReAct Repo Interrogator Tool Bounds & 150-Line Caps         │
                  │  - 3-Agent Hiring Committee Debate Turns & Verdict Calibration │
                  │  - HITL Sourcer Approval State Transitions & Safe Gates        │
                  │  - pgvector Cosine Distance & SHA-256 Cache Sub-5ms Retrieval  │
                  │  - HMAC Token Verification & Offer Expiration Lifecycles       │
                  └────────────────────────────────────────────────────────────────┘
```

Run the entire test suite locally:

```bash
# 1. Run root unit & integration tests (174 tests)
pnpm test

# 2. Run backend NestJS unit tests (287 tests)
npm --prefix backend run test

# 3. Run backend cross-service integration tests (50 tests)
npm --prefix backend run test:integration

# 4. Verify TypeScript type checking (0 diagnostics)
pnpm exec tsc --noEmit
```

---

## Cloud Infrastructure (Terraform IaC)

All cloud resources are managed declaratively in `infra/terraform/`:

- **AWS S3 (`infra/terraform/s3.tf`):** Dedicated private document bucket with `aws_s3_bucket_public_access_block` enabled, AES-256 server-side encryption, S3 bucket versioning, and scoped CORS rules for web client uploads.
- **AWS IAM (`infra/terraform/iam.tf`):** Least-privilege IAM policies granting scoped `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` permissions strictly bounded to the VectorHire bucket ARN, attached to an EC2 execution role.
- **AWS EC2 (`infra/terraform/ec2.tf`):** Scalable compute node running containerized NestJS gateway and BullMQ queue worker processes with CloudWatch monitoring.
- **Security Groups (`infra/terraform/security_groups.tf`):** Ingress/egress rules enforcing isolated network boundaries between API gateway, worker nodes, and Redis.

---

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

### 3. Environment Configuration

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Key environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase connection.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side database access.
- `GEMINI_API_KEY`: Google GenAI API key for ReAct agent & Hiring Committee.
- `REDIS_URL`: Redis connection string (`redis://127.0.0.1:6379`).
- `OFFER_SIGNING_SECRET`: Cryptographic key for HMAC offer tokens.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`: AWS S3 document storage.

### 4. Database Setup

Execute migrations sequentially in your Supabase SQL editor:
- `supabase/migrations/0002_ingestion_pipeline.sql` through `0010_pgvector_and_caching.sql`
- `supabase/migrations/0011_agentic_committee_and_sourcer.sql`

### 5. Run Development Servers

```bash
# Terminal 1: Backend Gateway & Queue Workers
npm run dev:backend

# Terminal 2: Next.js Frontend
pnpm dev
```

The Next.js app runs at `http://localhost:3000` and the NestJS backend runs at `http://localhost:3001`.

---

## Production Build & Verification

```bash
# Build NestJS backend (tsc + tsc-alias)
npm --prefix backend run build

# Build Next.js production bundle (Turbopack)
pnpm run build
```

---

## License

This project is licensed under the MIT License.
