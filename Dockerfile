FROM node:20-alpine AS base
# openssl: Prisma's query engine needs it on Alpine
RUN apk add --no-cache openssl libc6-compat \
  && corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

FROM base AS deps
# Native modules (bufferutil, utf-8-validate) have no prebuilt binaries for
# linux/arm64 musl, so they compile — e.g. on Apple Silicon.
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY apps/bot/package.json apps/bot/
COPY apps/collector/package.json apps/collector/
COPY apps/web/package.json apps/web/
COPY apps/landing/package.json apps/landing/
COPY packages/analytics/package.json packages/analytics/
COPY packages/database/package.json packages/database/
COPY packages/parsers/package.json packages/parsers/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

FROM deps AS build
# Next.js inlines NEXT_PUBLIC_* at build time, so the public URLs are build args.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_PRODUCT_URL=http://localhost:3000
ARG NEXT_PUBLIC_BOT_URL=https://t.me/your_bot
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_PRODUCT_URL=$NEXT_PUBLIC_PRODUCT_URL \
    NEXT_PUBLIC_BOT_URL=$NEXT_PUBLIC_BOT_URL
COPY . .
RUN pnpm db:generate \
  && pnpm build:packages \
  && pnpm --filter @carparty/api build \
  && pnpm --filter @carparty/web build \
  && pnpm --filter @carparty/landing build

# ─── 1. Backend: API + парсери (collectors) ───
FROM base AS backend
WORKDIR /app
COPY --from=build /app /app
RUN chmod +x scripts/docker-backend-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "scripts/docker-backend-entrypoint.sh"]

# ─── 2. Product: веб-CRM + Telegram-бот ───
FROM base AS product
WORKDIR /app
COPY --from=build /app /app
RUN chmod +x scripts/docker-product-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "scripts/docker-product-entrypoint.sh"]

# ─── 3. Landing: маркетинговий сайт ───
FROM base AS landing
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@carparty/landing", "start"]
