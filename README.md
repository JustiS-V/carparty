# CarParty

Monorepo для сервісу моніторингу авто-оголошень в Україні: **Telegram-бот**, **веб-CRM**, **парсери**, **оплата**.

## Архітектура — 3 Docker-контейнери

| Контейнер | Що всередині | Порт |
|-----------|--------------|------|
| **backend** | NestJS API, JWT auth, PostgreSQL (Prisma), парсери (Telegram / OLX / AUTO.RIA) | 4000 |
| **product** | Next.js CRM (логін, кабінет, оплата) + Telegram-бот зі сповіщеннями | 3000 |
| **landing** | Маркетинговий лендінг | 3001 |

Окремо: **PostgreSQL** — база даних (інфраструктура, не частина продуктової логіки).

```
carparty/
├── apps/
│   ├── api/          # REST API, auth, payments
│   ├── collector/    # парсери → backend
│   ├── bot/          # Telegram-бот
│   ├── web/          # продуктовий UI (CRM)
│   └── landing/      # маркетинговий сайт
├── packages/
│   ├── database/     # Prisma schema
│   ├── parsers/      # парсинг оголошень
│   ├── analytics/    # metric registry
│   └── types/        # shared types
├── Dockerfile        # targets: backend | product | landing
└── docker-compose.prod.yml
```

## Стек

- **Frontend:** Next.js 14, Tailwind
- **Backend:** NestJS, JWT auth, RBAC
- **Database:** PostgreSQL, Prisma
- **Bot:** Grammy (Telegram)
- **Collectors:** GramJS, OLX, AUTO.RIA API

## Локальна розробка

```bash
# 1. PostgreSQL
docker compose up -d

# 2. Залежності
pnpm install

# 3. Env
cp .env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/landing/.env.example apps/landing/.env.local

# 4. БД
pnpm db:push
pnpm --filter @carparty/database seed

# 5. Запуск (turbo — всі сервіси паралельно)
pnpm dev
```

| Сервіс | URL |
|--------|-----|
| Landing | http://localhost:3001 |
| Product (CRM) | http://localhost:3000 |
| API | http://localhost:4000/api |

Окремо: `pnpm bot:dev`, `pnpm collector:dev`, `pnpm landing:dev`

## Production (Docker)

```bash
cp .env.production.example .env.production
# заповнити секрети

docker compose -f docker-compose.prod.yml up -d --build
```

| Сервіс | URL (за замовч.) |
|--------|------------------|
| Landing | http://localhost:3001 |
| Product | http://localhost:3000 |
| Backend API | http://localhost:4000/api |

## Ролі (веб-CRM)

| Роль | Зона |
|------|------|
| CLIENT | Особистий кабінет, підписка |
| WORKER | CRM: ліди, заявки |
| SUPER_ADMIN | Адмінка, метрики, канали, бот |

## Демо-аккаунти

| Email | Пароль | Роль |
|-------|--------|------|
| admin@carparty.local | admin123 | Super Admin |
| worker@carparty.local | worker123 | Worker |
| client@carparty.local | client123 | Client |

## API (backend)

```
POST /api/auth/login
POST /api/collectors/ingest     # парсери (API key)
POST /api/payments/liqpay/callback
GET  /api/analytics/query
```
