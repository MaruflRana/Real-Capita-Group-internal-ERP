# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED="1"
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_DIR="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /workspace

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json eslint.config.mjs .prettierrc ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

FROM deps AS development

ENV NODE_ENV="development"

EXPOSE 3000

CMD ["pnpm", "exec", "nx", "dev", "web", "--hostname", "0.0.0.0", "--port", "3000"]

FROM deps AS builder

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_BASE_URL

ENV NODE_ENV="production"
ENV NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}"
ENV NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL}"

RUN pnpm build:web

FROM node:22-bookworm-slim AS runner

ENV NEXT_TELEMETRY_DISABLED="1"
ENV NODE_ENV="production"

WORKDIR /app

COPY --from=builder /workspace/apps/web/.next/standalone ./
COPY --from=builder /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /workspace/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
