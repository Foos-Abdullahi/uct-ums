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

## [0.1.0] — Phase 1 scaffold

_Not yet released._
