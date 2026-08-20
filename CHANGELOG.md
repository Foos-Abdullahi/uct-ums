# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Role-based portals (`admin`, `registrar`, `finance`, `hr`, `lecturer`, `student`) with navigation and placeholder pages
- `UserRole` enum, `students` / `staff` / `programs` tables, and UCT demo seed data
- `EnsureUserHasRole` and `FeeGateMiddleware` (student fee gate stub)
- Role-based login redirect via Fortify `LoginResponse`
- UCT brand colors (`#1B2F5B`) applied to theme tokens
- Project documentation in `/docs`
- **Students & Admissions Module** (Admin portal):
  - Database: `admissions`, `student_documents`, `student_invoices`, `student_payments`, `student_grades`, `student_certificates`, `student_attendances` tables; enhanced `students` table with `current_semester`, `phone`, `gender`, `date_of_birth`, `address`, `enrollment_status`, `gpa`, `graduation_date`
  - Models: `Admission`, `StudentDocument`, `StudentInvoice`, `StudentPayment`, `StudentGrade`, `StudentCertificate`, `StudentAttendance` with relationships, scopes, and financial recalculation helpers
  - Factories: `AdmissionFactory`, `StudentInvoiceFactory`, `StudentPaymentFactory`, `StudentGradeFactory` with states
  - `StudentSeeder` with rich demo data (admissions, invoices, payments, grades, documents, certificates, attendance)
  - `StudentController`: full CRUD, deferred stats/pagination, status toggle, password reset, invoice/payment/grade/document/certificate management (17 routes)
  - `AdmissionController`: application CRUD, status review, conversion to student with auto-generated matric number and default tuition invoice (7 routes)
  - Frontend pages: `Admin/students/{index,create,edit,show}` and `Admin/admissions/{index,create,show}` with Deferred MetricCards, server-side filtered DataTables, entrance animations, and 8-tab student profile
  - UI helpers: `Tabs`, `ConfirmDeleteDialog`, `PermissionCheck`, `Popover`, `Command` components; 8 student modal components, 5 admission modal components
  - 41 new Pest feature tests across `StudentManagementTest` and `AdmissionManagementTest` (all passing)

## [0.1.0] — Phase 1 scaffold

_Not yet released._
