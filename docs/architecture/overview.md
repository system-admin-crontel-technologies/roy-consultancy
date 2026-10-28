# Architecture overview

Modular monolith, as recommended by the SRS. One NestJS API, one Next.js web app, one PostgreSQL database.

## Request flow

```
Browser ──(same-origin cookies)──▶ Next.js (apps/web)
   │                                   │  /api/v1/*  BFF passthrough (forwards Cookie, returns Set-Cookie)
   │                                   ▼
   │                              NestJS API (apps/api)  ──▶ PostgreSQL / Valkey / SMTP / S3
   │
Android ──(Bearer tokens)──────────▶ NestJS API
```

- Server Components call the API directly with the caller's cookies (`src/lib/api/server.ts`).
- Client Components call `/api/v1/*` on the web origin (`src/lib/api/client.ts`); the route handler in
  `src/app/api/v1/[...path]/route.ts` proxies to the API and passes cookies both ways.
- `src/proxy.ts` is an optimistic gate only. Authorization is enforced by the API on every request.

## Sessions

- Access token: short-lived JWT (HS256, 15 min) carrying `sub` (user id) and `sid` (session id).
- Refresh token: opaque, random, stored hashed in `sessions`, rotated on every refresh. Reuse of a rotated
  token revokes the whole token family (theft detection).
- Web: HttpOnly cookies `rc_access` (path `/`) and `rc_refresh` (path `/api/v1/auth`).
- Mobile: tokens in the JSON body, sent as `Authorization: Bearer`.
- Every request resolves the principal (user, roles, permissions) from the session, cached in-process for
  30 seconds. Role changes, suspensions and session revocations therefore apply within 30 seconds.
- Account lockout: 5 failed logins lock the account for 15 minutes.

## Authorization

- Permissions are action codes (`users.manage`, `cases.transition`, ...) defined once in
  `packages/types/src/permissions.ts` and seeded into the database.
- Controllers declare `@RequirePermissions(...)`; `PermissionsGuard` enforces and audits denials.
- `SUPER_ADMIN` always holds every permission and cannot be edited.
- Safety rules in `UsersService`: no self-suspension, no removing your own Super Admin role, at least one
  other active Super Admin must remain.

## Audit

`audit_logs` is append-only (database triggers reject UPDATE/DELETE). Entries record actor, action,
resource, outcome, correlation id, IP, user agent and redacted before/after snapshots. Audit rows are
written inside the same transaction as the business change wherever possible.

## Catalogue versioning

`services` → `service_versions` (immutable once published; exactly one `isCurrent`) → `service_prices`.
Money is stored in integer minor units (paise); tax rates in basis points. Orders and cases in later
phases will reference `service_versions.id`, never the service directly.

## Numbering

`numbering_sequences` holds prefix, padding, reset policy (never / calendar year / financial year) and the
next value. `SettingsService.nextReference(tx, key)` allocates numbers with `SELECT ... FOR UPDATE` inside
the caller's transaction.

## Background jobs

BullMQ on Valkey. Phase 1 has the `mail` queue (5 attempts, exponential backoff, idempotent job ids).
Later phases add reminders, obligation generation, report exports and document scanning.

## Validation and errors

Zod schemas attached to `@Body/@Query/@Param` with Nest's `StandardSchemaValidationPipe`; unknown fields are
rejected. Every error response has the shape `{ statusCode, error, message, details?, correlationId }`.
The `x-correlation-id` response header matches the structured log line.
