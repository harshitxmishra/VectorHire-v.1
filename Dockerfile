# =============================================================================
# VectorHire Frontend (Next.js 16 / React 19) Multi-Stage Dockerfile
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable Corepack for deterministic pnpm package management
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy installed dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production build configuration
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Compile Next.js standalone application
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for Next.js prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build output and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Run container as unprivileged user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
