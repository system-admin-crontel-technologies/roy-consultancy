# Roy Consultancy Operations Platform

Internal practice-management platform for Roy Consultancy (business registrations, tax registrations,
corporate compliance, intellectual property). Built from the Software Requirements Specification in
`docs/requirements/`.

| App | Stack | Path |
| --- | --- | --- |
| Public website + Super Admin panel (`/admin`) | Next.js 16, React 19, Tailwind 4 | `apps/web` |
| REST API | NestJS 12, Prisma 7, PostgreSQL 16, Valkey/BullMQ | `apps/api` |
| Android staff app | Kotlin, Jetpack Compose | `apps/android` (scaffolded in a later phase) |
| Shared contracts and permission catalogue | TypeScript | `packages/types` |

Current phase: **Super Admin** (authentication, users, roles and permissions, organisation settings,
numbering sequences, service catalogue configuration, integrations registry, audit log, website enquiries).
The public website (Home, Services, About, Contact) is implemented from the design handoff in
`docs/design/website`; its contact form posts to the API and lands in `/admin/enquiries` plus the
organisation email set under Settings. Contact details are placeholders until set via `NEXT_PUBLIC_*`
variables (see `.env.example`).

## Quick start (local development)

Requirements: Node 22, pnpm 9, Docker.

```bash
cp .env.example .env              # then edit secrets if you like
pnpm install
pnpm docker:dev                   # postgres, valkey, rustfs (S3), mailpit, clamav
pnpm --filter @roy/types build
pnpm db:migrate                   # applies migrations (prisma migrate dev)
pnpm db:seed                      # permissions, roles, super admin, demo catalogue
pnpm dev                          # api on :4000, web on :3000
```

Then open:

- Admin: http://localhost:3000/admin (sign in with `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` from `.env`)
- API docs: http://localhost:4000/api/docs
- Mailpit (invitation and reset emails): http://localhost:8035
- RustFS console (object storage): http://localhost:9011

Ports are deliberately non-default (5440, 6390, 9010, 8035, 1035, 3320) to avoid clashing with other
projects on the same machine. Change them in `.env`.

## Full stack in Docker

```bash
pnpm docker:up      # builds api + web images and starts everything
pnpm docker:down
```

The API container applies migrations on start (`RUN_MIGRATIONS=true`) and seeds when `RUN_SEED=true`.
Set `SEED_DEMO_DATA=false` and `RUN_SEED=false` for production.

## Repository layout

```
apps/api            NestJS API (modules: auth, users, roles, settings, integrations, catalogue, audit, mail, health)
apps/api/prisma     schema.prisma, migrations, seed.ts
apps/web            Next.js app: (site) public website, (admin) admin panel, api/v1 BFF passthrough
apps/android        Kotlin app (later phase)
packages/types      @roy/types: permission catalogue, role templates, API contract types
infra/docker        Dockerfiles, compose.yml (full stack), compose.dev.yml (infra only)
docs                requirements, architecture notes, API notes, runbooks
```

## Common commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | run api and web in watch mode |
| `pnpm typecheck` | TypeScript across all packages |
| `pnpm lint` | oxlint (api) and eslint (web) |
| `pnpm test` | vitest unit tests (api) |
| `pnpm --filter api test:e2e` | API end-to-end tests against the dev database |
| `pnpm db:migrate` | create/apply a migration from schema changes |
| `pnpm db:seed` | idempotent seed |

See `docs/runbooks/local-development.md` and `docs/architecture/overview.md` for details.
