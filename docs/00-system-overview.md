# System overview

## Actors

| Role | Summary |
|---|---|
| Super Admin | Full control — configuration, roles, all modules |
| Registrar | Admissions, programs, courses, enrollment, transcripts |
| Finance | Fee structures, invoices, payments, fee-status overrides |
| HR | Staff records, contracts, leave |
| Lecturer | Their courses, attendance, gradebook, materials |
| Student | Own enrollment, grades, attendance, fee balance — gated by payment |

There is **no parent/guardian role**.

## Programs (UCT)

- Bachelor of Science in Software Engineering
- Bachelor of Science in Networking and Cyber Security
- Bachelor of Science in Animation and Visual Effects

## Core business rules

1. **Fee gate** — unpaid students are blocked beyond payment/profile/logout (`docs/05-security-fee-gate.md`).
2. **No parent access** — enforced at role enum and policy level.
3. **Full audit trail** — grades versioned, payments immutable, `activity_log` for sensitive actions (Phase 3).

## Modules

Admissions · SIS · Academics · Attendance · Gradebook · Finance · HR · Notifications · Reporting · Document Center · Library (deferred)
