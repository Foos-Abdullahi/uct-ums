# Architecture

## Three-tier layout

```
Client        React 19 + TS · Inertia.js · Tailwind + shadcn/ui
Application   Laravel 12 · Fortify · Queues (Phase 3+)
Data          MySQL · Redis (Phase 3+)
```

## Request flow (student)

1. Credentials verified → session issued.
2. `FeeGateMiddleware` on student routes (except locked/profile/logout).
3. `fee_status = paid` → normal access; otherwise → locked payment screen.

## Portals

Each role has a URL prefix and dedicated Inertia page namespace under `resources/js/pages/{role}/`.

Staff roles use sidebar layout; students use top navigation; fee-gate locked screen uses a minimal layout.

See `docs/05-security-fee-gate.md` for fee gate detail.
