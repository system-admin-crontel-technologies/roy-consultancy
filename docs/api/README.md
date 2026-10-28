# API notes

Base path: `/api/v1`. Interactive documentation: `/api/docs` (Swagger UI), JSON at `/api/docs-json`.

Phase 1 endpoints:

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/sessions/revoke-all`, `POST /auth/change-password`, `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`, `GET /auth/invitations?token=`, `POST /auth/invitations/accept` |
| Users | `GET/POST /users`, `GET/PATCH /users/:id`, `POST /users/:id/roles`, `/suspend`, `/activate`, `/disable`, `/resend-invite`, `GET /users/:id/sessions`, `POST /users/:id/sessions/revoke-all`, `GET/POST /departments`, `PATCH /departments/:id` |
| Roles | `GET /permissions`, `GET/POST /roles`, `GET/PATCH /roles/:id`, `PUT /roles/:id/permissions` |
| Settings | `GET/PUT /settings/organisation`, `GET /settings/sequences`, `PATCH /settings/sequences/:key`, `GET /settings/timezones` |
| Integrations | `GET /integrations`, `PATCH /integrations/:key`, `POST /integrations/:key/health-check` |
| Catalogue | `GET/POST /catalogue/categories`, `PATCH /catalogue/categories/:id`, `GET/POST /catalogue/services`, `GET/PATCH /catalogue/services/:id`, `POST .../status`, `POST .../verify`, `POST .../versions`, `PATCH .../versions/:vid`, `PUT .../versions/:vid/price`, `POST .../versions/:vid/publish` |
| Enquiries | `POST /public/enquiries` (unauthenticated, 5/min per IP, honeypot field `website`), `GET /enquiries`, `GET /enquiries/:id`, `PATCH /enquiries/:id` |
| Audit | `GET /audit-logs`, `GET /audit-logs/actions` |
| Admin | `GET /admin/overview` |
| Health | `GET /health/live`, `GET /health/ready` |

Conventions: list endpoints take `page` and `pageSize` (max 100) and return `{ items, total, page, pageSize }`.
Errors return `{ statusCode, error, message, details?, correlationId }`.
Write endpoints require the permission named in the controller (`@RequirePermissions`).
