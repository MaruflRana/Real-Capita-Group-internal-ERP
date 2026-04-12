# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

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

EXPOSE 3333

CMD ["sh", "-c", "CI=true pnpm install --frozen-lockfile && pnpm prisma generate --schema prisma/schema.prisma && pnpm build:api && node dist/apps/api/main.js"]

FROM deps AS builder

ENV NODE_ENV="production"

RUN pnpm prisma generate --schema prisma/schema.prisma && pnpm build:api

FROM base AS runner

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=builder /workspace/dist/apps/api ./

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3333

CMD ["node", "main.js"]
