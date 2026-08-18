# UCT-UMS

**University Management System for University College of Technology (UCT)**  
Hodan, Mogadishu, Somalia · [uct.so](https://uct.so)

A full end-to-end platform covering admissions, academics, attendance, grading, finance, and reporting — built with a hard rule that unpaid students cannot access the system, no parent/guardian role exists, and every sensitive action is permanently auditable.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Inertia.js, Tailwind CSS, shadcn/ui |
| Backend | Laravel 12, PHP 8.4+, Laravel Fortify |
| Database | MySQL |
| Local dev | Laravel Herd (Windows) |

## Quick start (Herd)

```bash
git clone <repo-url> uct-ums
cd uct-ums

composer install
cp .env.example .env
php artisan key:generate

npm install
npm run dev

php artisan migrate --seed
```

Point Herd at the project folder; the site is served at `https://uct-ums.test`.

## Demo accounts (password: `password`)

| Role | Email |
|---|---|
| Super Admin | `admin@uct.so` |
| Registrar | `registrar@uct.so` |
| Finance | `finance@uct.so` |
| HR | `hr@uct.so` |
| Lecturer | `lecturer@uct.so` |
| Student (unpaid — fee gate) | `student@uct.so` |
| Student (paid) | `student.paid@uct.so` |

## Portal routes

| Role | Prefix | Layout |
|---|---|---|
| Super Admin | `/admin` | Sidebar |
| Registrar | `/registrar` | Sidebar |
| Finance | `/finance` | Sidebar |
| HR | `/hr` | Sidebar |
| Lecturer | `/lecturer` | Sidebar |
| Student | `/student` | Top navigation |

## Core rules

1. **No parent/guardian role** — only Student, Lecturer, Registrar, Finance, HR, and Super Admin.
2. **Fee gate** — unpaid students authenticate but are blocked except payment, profile, and logout. See `docs/05-security-fee-gate.md`.
3. **Full audit trail** — grades, payments, and enrollment changes are versioned/logged (Phase 3).

## Documentation

See [`/docs`](./docs) for system overview, architecture, roadmap, brand guide, database schema, and security.

## License

Proprietary — © University College of Technology. Not for external distribution without permission.
