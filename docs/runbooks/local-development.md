# Local development runbook

## First run

1. `cp .env.example .env`
2. `pnpm install`
3. `pnpm docker:dev` starts PostgreSQL, Valkey, RustFS, Mailpit and ClamAV.
4. `pnpm --filter @roy/types build`
5. `pnpm db:migrate` then `pnpm db:seed`
6. `pnpm dev`

## Environment

All configuration is in the root `.env` (never committed). Both apps load it from the repository root.
`apps/api/src/config/env.ts` validates every variable at start-up and fails fast with a readable message.

## Database changes

1. Edit `apps/api/prisma/schema.prisma`.
2. `pnpm --filter api prisma:migrate --name <change>` creates and applies a migration.
3. Commit the migration folder. Hand-written SQL (triggers, partial indexes) goes in the migration file.

`prisma migrate reset` is intentionally not run by automation; reset the dev database manually if needed.

## Seed

`pnpm db:seed` is idempotent. It never overwrites customised role grants (except SUPER_ADMIN), re-applies
the permission catalogue, creates the initial Super Admin from `SEED_SUPER_ADMIN_*` if missing, and inserts
demo catalogue rows (`isDemo = true`, `DEMO-` codes) only when `SEED_DEMO_DATA=true` and not in production.

## Email

Mailpit captures all outbound email at http://localhost:8035. Invitation and password reset links point at
`NEXT_PUBLIC_SITE_URL`.

## Queues

Mail delivery runs through BullMQ. If Valkey is down, the API still starts; emails queue once it returns.

## Ports

| Service | Port |
| --- | --- |
| web | 3000 |
| api | 4000 (`/api/docs` for Swagger) |
| postgres | 5440 |
| valkey | 6390 |
| rustfs S3 / console | 9010 / 9011 |
| mailpit UI / SMTP | 8035 / 1035 |
| clamav | 3320 |
