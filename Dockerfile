FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY apps/bot/package.json apps/bot/
COPY apps/collector/package.json apps/collector/
COPY apps/web/package.json apps/web/
COPY apps/landing/package.json apps/landing/
COPY packages/*/package.json packages/
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm db:generate \
  && pnpm --filter @carparty/database build \
  && pnpm --filter @carparty/parsers build \
  && pnpm --filter @carparty/analytics build \
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
