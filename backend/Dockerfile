# =============================================================================
# VectorHire Backend (NestJS Modular Monolith) Multi-Stage Dockerfile
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root domain library (imported by backend via @/* path alias)
COPY lib ./lib

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend ./

# Compile TypeScript modular monolith into dist/
ENV NODE_ENV=production
RUN npm run build

# Prune development dependencies for minimal runtime footprint
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=4000
ENV BACKEND_PORT=4000

# Create non-root system group and user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy pruned production node_modules and compiled output with correct ownership
COPY --from=builder --chown=nestjs:nestjs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/backend/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/backend/package.json ./package.json

# Run as unprivileged user
USER nestjs

EXPOSE 4000

CMD ["node", "dist/backend/src/main.js"]
