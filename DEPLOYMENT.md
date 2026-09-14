# Deployment

This document is the runbook for building and deploying the application. It is aimed at a developer (`development`, sandbox, production, `main`) who needs to ship changes or recover from a failed deploy.

## Environment overview

| Branch | Purpose | CI | Auto-deploy |
|---|---|---|---|
| `development` | You push new work here. | CI runs on the deploy PR (and on `main` after sync). | — |
| `sandbox` | Staging site at https://local.uct.so. **Branch-protected**: merge only via PR development → sandbox. | `ci` check required on the PR. | Yes — push to `sandbox` triggers `Deploy Sandbox`. |
| `main` | Release / canonical mirror of `development` (triggers `tests` on push). | `tests` on every push. | — |
| `production` | Production mirror of `development`. | — | — (future) |
| `feat-academic` | Feature mirror of `development`. | — | — |

Only the sandbox has an automatic pipeline today. `production` / `feat-academic` / `main` are kept in sync with `development` by explicit fast-forward pushes.

## The only deploy path: PR development → sandbox

Direct and force pushes to `origin/sandbox` are blocked. The supported flow:

```powershell
# 1. commit and push your work
git push origin development

# 2. open the deploy PR and auto-merge once CI (composer ci:check) is green
./scripts/deploy/open-sandbox-pr.ps1 -AutoMerge
```

What the script does:

- fetches both branches, aborts if they are identical (`Nothing to deploy`);
- reuses an existing open deploy PR or creates one (`Deploy development -> sandbox`);
- enables GitHub **Auto merge** (merge commit), so no further clicks are needed;
- polls the `ci` check and reports the result.

Once the PR merges, GitHub pushes to `sandbox`, which runs the `Deploy Sandbox` workflow. Merging is automatically allowed once the `ci` check passes (the bot/owner merges are not blocked by review).

### If you review PRs and want an approval gate

`sandbox` protection currently requires **one approving review** for non-admin contributors and lets admins merge directly (`enforce_admins: false`). To make every merge require an explicit human approval, flip `enforce_admins` to `true` in the branch-protection settings.

## What the deploy workflow does

`.github/workflows/deploy-sandbox.yml` (triggered by push to `sandbox`, also `workflow_dispatch` for re-deploys):

1. `composer install --no-dev --optimize-autoloader`, `npm ci && npm run build` on the runner;
2. package the app (`composer.lock`, vendor, built assets) into a tarball;
3. upload over FTP to `public_html/_deploy/` using repo secrets:
   - `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`;
4. run `public_html/_deploy/ums_extract.php`, which moves the archive into `/home/localuct/ums` while keeping `storage/` and the live `.env`;
5. run `ums_run.php`: artisan `config:clear`, `migrate --force`, seed (Admin, RolePermission, ChartOfAccounts), `config:cache`, `view:cache`;
6. boot self-check: the server issues its own HTTP GET to `/` and prints `BOOT_STATUS` (a 3xx means OK). If the app returns ≥ 400 it copies `laravel.log` to `_deploy/_boot_error.log` so the failure shows up in the Actions log;
7. final `curl https://local.uct.so/` sanity check from the runner.

## Database / config secrets

Database, FTP and app-config values are read from GitHub Actions secrets (`Settings → Secrets and variables → Actions`), and substituted into the deployed `.env` only when a matching value exists. The live `.env` on the server is preserved between deploys.

Required secrets:

| Secret | Purpose |
|---|---|
| `APP_URL` | Public app URL, e.g. `https://local.uct.so` |
| `DB_NAME` | MySQL database name |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `FTP_HOST` | Server FTP host |
| `FTP_USER` | FTP account (cPanel user) |
| `FTP_PASSWORD` | FTP password |
| `DEPLOY_TOKEN` | Phrase used to activate `_deploy` scripts in the public directory |

Credentials for cPanel/MySQL live in cPanel (not the repo). Rotate the DB password in cPanel → MySQL® Databases (`Mysql::set_password` via UAPI) and update the `DB_PASSWORD` secret before the next deploy.

## Verifying a deployment

1. Open the latest run of the `Deploy Sandbox` workflow and check the last steps: `BOOT_STATUS=3xx` and `curl` exit 0.
2. `curl https://local.uct.so/` → expect a redirect to `/login` (HTTP 302) and the app page (HTTP 200).
3. Sign in with the seeded admin login: `admin@uct.edu` / seeded `password`.
4. Read server logs (`laravel.log`) if the app misbehaves — it is copied into `public_html/_deploy/_boot_error.log` by the self-check on failure.

## Rollback

Because force-push to `sandbox` is blocked, rollback is a PR too:

1. Pin development to the last known-good commit:
   ```powershell
   git branch backup-$headName  # safety checkpoint
   git checkout -b rollback origin/sandbox
   git reset --hard <last-good-sha>   # from git log origin/sandbox
   git push origin rollback
   # open PR rollback -> sandbox via the script: ./scripts/deploy/open-sandbox-pr.ps1 -Base sandbox -Head rollback
   ```
2. Merge → the deploy workflow redeploys that commit.
3. Database changes from the failed release are NOT automatically undone; run a DB restore in cPanel if the schema was migrated.

Re-deploying the same commit without a PR is possible via `workflow_dispatch` in the `Deploy Sandbox` workflow (redeploys current `sandbox`, useful after a botched release).

## Syncing the other branches

After the sandbox deploy is verified, mirror `development` into the others (all fast-forward, no deploy side-effects; `main` also re-runs `tests`):

```powershell
git push origin development:main
git push origin development:production
git push origin development:feat-academic
```

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Deploy fails at FTP upload (`curl exit 6`) | `FTP_HOST`/`FTP_USER`/`FTP_PASSWORD` missing or wrong; check secrets. |
| `BOOT_STATUS` is 4xx/5xx | App boot error; read `_deploy/_boot_error.log`, check `.env` (wrong DB creds are the classic cause → verify `DB_PASSWORD` secret), run migrations manually if needed. |
| `App not found / 404 unknown domain` | stale server config; check `APP_URL` secret and cPanel host routing. |
| Dependencies missing after deploy | `.env` uses `production` (`config:cache`) without `vendor`; the workflow installs `--no-dev`, so dev-only packages must not be required at runtime. |

All passwords/keys above are managed outside this repository; the repo only stores secret **names**.