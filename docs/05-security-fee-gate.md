# Security & the fee gate

## The rule

Authentication and authorization to use the system are separate for students. Valid credentials always log in; access is what gets blocked.

## How it works

1. Student logs in → session issued.
2. `FeeGateMiddleware` runs on gated student routes.
3. `students.fee_status` checked (stored column, not client flag).
4. `paid` → proceed; `unpaid` / `partial` → redirect to locked screen.

**Allowed when unpaid:** `student/fees`, `student/fees/locked`, profile (read-only), logout.

Staff roles never pass through fee gate middleware.

## Overrides (Phase 3)

Registrar and Finance override with mandatory reason, logged to `activity_log`.

## RBAC

Data-driven permissions via policies (Phase 1 scaffold uses role middleware).

## Other requirements (Phase 3–4)

Rate limiting, signed payment webhooks, 2FA for Finance/Super Admin, login history.
