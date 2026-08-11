# CarParty

Monorepo для автомобильной компании: **пригон**, **разборка**, **сервис**, **продажа** авто из США.

## Стек

- **Frontend:** Next.js 14, Tailwind, Recharts
- **Backend:** NestJS, JWT auth, RBAC
- **Database:** PostgreSQL, Prisma
- **Analytics:** расширяемый Metric Registry (новые ключи без деплоя)

## Структура

```
carparty/
├── apps/
│   ├── web/          # Next.js — клиент / воркер / админ
│   └── api/          # NestJS REST API
├── packages/
│   ├── analytics/    # registry + tracker
│   ├── database/     # Prisma schema
│   └── types/        # shared TypeScript types
└── docker-compose.yml
```

## Роли

| Роль | Зона |
|------|------|
| CLIENT | Личный кабинет, заявки, каталог |
| WORKER | CRM: пригон, разборка, сервис, продажа |
| SUPER_ADMIN | Всё + пользователи + метрики |

## Быстрый старт

```bash
# 1. PostgreSQL
docker compose up -d

# 2. Зависимости
pnpm install

# 3. Env
cp .env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. БД
pnpm db:push
pnpm --filter @carparty/database seed

# 5. Запуск
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api

## Демо-аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@carparty.local | admin123 | Super Admin |
| worker@carparty.local | worker123 | Worker |
| client@carparty.local | client123 | Client |

## Аналитика

### Трекинг события

```typescript
import { track } from '@carparty/analytics';

track({
  metric: 'listing.views',
  value: 1,
  dimensions: { listing_id: 'abc', source: 'catalog' },
});
```

### Новый ключ через админку

`/admin/metrics` — форма добавления метрики (key, label, type, aggregation, chartType).

### API

```
POST /api/analytics/track
POST /api/analytics/track/batch
GET  /api/analytics/metrics
POST /api/analytics/metrics
GET  /api/analytics/query?metric=sales.count&period=last_30_days
GET  /api/analytics/dashboards
```

## CRM-модули

- `POST /api/import` — заявки на пригон
- `GET  /api/dismantle/parts` — каталог запчастей
- `POST /api/service` — заказ-наряды
- `GET  /api/sales/listings` — объявления (+ автотрекинг views/clicks)
