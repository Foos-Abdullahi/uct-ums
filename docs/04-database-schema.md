# Database schema (core)

## Core tables

`users`, `students`, `staff`, `programs`, `courses`, `course_sections`, `semesters`, `enrollments`, `attendance`, `grades`, `fee_structures`, `invoices`, `payments`, `activity_log`

## Phase 1 implemented

- `users` — `role`, `is_active`
- `students` — `matric_no`, `program_id`, `fee_status` (indexed)
- `staff` — `department`, `position`, `hire_date`
- `programs` — UCT degree programs

## Conventions

- Soft deletes on academic/financial tables (Phase 3)
- `grades.version` — new row per edit
- Payments immutable; corrections via reversing entries
