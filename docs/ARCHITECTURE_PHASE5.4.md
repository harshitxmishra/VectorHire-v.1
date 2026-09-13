# VectorHire — Phase 5.4 Containerization Architecture

**Phase:** Phase 5.4 — Production Containerization & Docker Orchestration  
**Status:** Complete & Verified  
**Date:** 2026-09-12  

---

## 1. Why Docker Was Introduced

VectorHire is a TypeScript modular monolith comprising a Next.js 16 App Router frontend, a NestJS backend with 6 asynchronous BullMQ background workers, Supabase PostgreSQL, and Redis.

Docker packaging was introduced in Phase 5.4 to provide:
1. **Deterministic Production Artifacts**: Encapsulating Node.js 22 runtime dependencies and standalone bundles.
2. **Standardized Local & CI Infrastructure**: Enabling instant, reproducible provisioning of Redis and optional local test databases.
3. **Defense-in-Depth Process Isolation**: Running applications under unprivileged non-root service accounts (`uid 1001`) with explicit resource boundaries.

---

## 2. Container Architecture

```
                                  HOST NETWORK
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │ :3000                                               │ :4000
            ▼                                                     ▼
 ┌──────────────────────┐                              ┌──────────────────────┐
 │ vectorhire-frontend  │ ────(Internal HTTP Calls)───▶│  vectorhire-backend  │
 │ (Next.js Standalone) │                              │ (NestJS + 6 Workers) │
 │ User: nextjs (1001)  │                              │ User: nestjs (1001)  │
 └──────────────────────┘                              └──────────┬───────────┘
            │                                                     │
            │           vectorhire-net (Bridge Network)           │
            └──────────────────────────┬──────────────────────────┘
                                       │ :6379
                                       ▼
                            ┌──────────────────────┐
                            │   vectorhire-redis   │
                            │   (redis:7-alpine)   │
                            │   Queue & PubSub     │
                            └──────────────────────┘
                                       │ (Optional Profile: local-db)
                                       ▼
                            ┌──────────────────────┐
                            │ vectorhire-postgres  │
                            │ (postgres:16-alpine) │
                            │ Isolated Local Test  │
                            └──────────────────────┘
```

---

## 3. Next.js Container (`Dockerfile`)

- **Base Image**: `node:22-alpine`
- **Output Mode**: `output: 'standalone'` configured in `next.config.mjs`.
- **Multi-Stage Structure**:
  - `deps`: Installs production and build dependencies with Corepack `pnpm install --frozen-lockfile`.
  - `builder`: Compiles the Next.js production build, outputting self-contained `.next/standalone` and `.next/static`.
  - `runner`: Lightweight runtime image copying only `.next/standalone`, `.next/static`, and `public/`.
- **Execution User**: `nextjs:nodejs` (UID `1001`, GID `1001`).
- **Entrypoint**: `node server.js` (Exposes Port `3000`).

---

## 4. NestJS Backend Container (`backend/Dockerfile`)

- **Base Image**: `node:22-alpine`
- **Multi-Stage Structure**:
  - `deps`: Installs backend dependencies using `npm ci`.
  - `builder`: Copies root `lib/` (required for `@/*` domain path mapping) and compiles TypeScript using `npm run build` (`tsc`). Runs `npm prune --omit=dev` to discard build tooling.
  - `runner`: Copies pruned `node_modules` and compiled `dist/` with explicit non-root file ownership.
- **Execution User**: `nestjs:nestjs` (UID `1001`, GID `1001`).
- **Entrypoint**: `node dist/backend/src/main.js` (Exposes Port `4000`).
- **Invariants Preserved**:
  - Full NestJS modular monolith lifecycle.
  - All 6 BullMQ workers (`ai-evaluation`, `resume-processing`, `github-processing`, `dataset-processing`, `email-processing`, `demonstrator`).
  - Graceful shutdown hooks (`app.enableShutdownHooks()`).
  - Uncaught exception and unhandled rejection safety handlers.
  - Zod startup environment validation (`validateEnv`).

---

## 5. Redis & PostgreSQL Compose Infrastructure (`docker-compose.yml`)

### Redis (`redis:7-alpine`)
- **Role**: Message broker and state store for BullMQ queues and health status.
- **Command**: `redis-server --save "" --appendonly no` (optimized for low memory and zero disk churn during local development).
- **Port**: `6379:6379` (Mapped to host for local dev tools and tests).

### PostgreSQL (`postgres:16-alpine`)
- **Role**: Optional local integration database (activated via `--profile local-db`).
- **Architecture Notice**: Supabase PostgreSQL remains the primary application database architecture. Local Postgres is provided solely for isolated offline integration testing.

---

## 6. Networking

- **Driver**: Dedicated bridge network `vectorhire-net`.
- **Service Discovery**: Inter-container communication uses service names:
  - Redis: `redis://redis:6379` (inside Compose) vs `redis://127.0.0.1:6379` (host direct).
  - Backend: `http://backend:4000` (internal) vs `http://localhost:4000` (browser/host).

---

## 7. Environment Variables

Docker integrates seamlessly with the existing Phase 5.2 Zod validation schema:

| Variable | Target | Scope | Notes |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend & Frontend | Runtime | Set to `production`. |
| `REDIS_URL` | Backend | Server | Set to `redis://redis:6379` in Compose. |
| `NEXT_PUBLIC_SUPABASE_URL` | Backend & Frontend | Public / Server | Supabase project endpoint. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Server Secret | Server-only service role key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Browser Public | Client-side anon key. |
| `PORT` | Backend / Frontend | Runtime | `4000` (Backend), `3000` (Frontend). |

---

## 8. Healthchecks

Docker Compose healthchecks leverage the native Phase 5.3 endpoints:

```yaml
# Backend Healthcheck
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/api/v1/health/live"]
  interval: 15s
  timeout: 3s
  retries: 3
  start_period: 10s

# Redis Healthcheck
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 3s
  retries: 3
  start_period: 5s
```

---

## 9. Non-Root Runtime Security

Both containers explicitly configure and switch to unprivileged system users:
- **Frontend**: `RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs` -> `USER nextjs`
- **Backend**: `RUN addgroup --system --gid 1001 nestjs && adduser --system --uid 1001 nestjs` -> `USER nestjs`
- Zero root container execution.
- Zero secrets copied into image layers.
- `.dockerignore` files prevent local `.env` and `node_modules` pollution.

---

## 10. Commands & Operations

### Build Images
```bash
# Build Frontend Image
docker build -t vectorhire-frontend:latest -f Dockerfile .

# Build Backend Image
docker build -t vectorhire-backend:latest -f backend/Dockerfile .
```

### Run Infrastructure Only (For local host development)
```bash
# Start Redis
docker compose up -d redis

# Start Redis + Local Postgres
docker compose --profile local-db up -d
```

### Run Full Stack with Compose
```bash
docker compose up -d
```

### Check Logs & Status
```bash
docker compose ps
docker compose logs -f backend
```

### Stop & Cleanup
```bash
docker compose down
```

---

## 11. 8 GB RAM Considerations

To remain responsive on an 8 GB RAM development machine:
1. **Explicit Memory Limits**:
   - `redis`: `256M`
   - `postgres`: `256M`
   - `backend`: `512M`
   - `frontend`: `512M`
   - Total stack allocation: `< 1.6 GB RAM`.
2. **Selective Startup**: Developers running Next.js / NestJS in watch mode locally need only run `docker compose up -d redis` (`~30MB RAM`).
3. **Pruned Runtime Layers**: Production containers discard TypeScript compilers and test suites.

---

## 12. What Is Intentionally NOT Included in Phase 5.4

In compliance with strict phase boundaries, Phase 5.4 excludes:
- Kubernetes manifests and Helm charts
- GitHub Actions CI/CD workflows
- Terraform and cloud infrastructure scripts
- Prometheus / Grafana monitoring stacks
- OpenTelemetry distributed tracing
- Microservice extraction or service meshes
- Kafka / RabbitMQ / MongoDB
