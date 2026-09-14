<#
.SYNOPSIS
    Open (or reuse) the deployment PR: development -> sandbox.
    Enables GitHub auto-merge so the sandbox deploy starts as soon as CI passes.

.DESCRIPTION
    The only supported path to deploy the sandbox is a merged PR from
    development into sandbox. Origin/sandbox is branch-protected:
      - direct/force pushes are blocked
      - the 'ci' check must pass
      - the PR needs (for non-admins) one approval

    This script:
      1. Verifies origin/development differs from origin/sandbox.
      2. Reuses an existing open deploy PR or creates a new one.
      3. (Optional -AutoMerge) enables GitHub auto-merge on the PR.
      4. Polls the 'ci' check and reports when it finishes.

.EXAMPLE
    # 1. push your work (CI for dev happens in the PR, not on push)
    git push origin development

    # 2. open the deploy PR and auto-merge it once CI is green
    ./scripts/deploy/open-sandbox-pr.ps1 -AutoMerge

.NOTES
    A GitHub token is required. Provide it via the GH_PAT or GITHUB_TOKEN
    environment variable, or install the gh CLI.
#>
[CmdletBinding()]
param(
    [string]$Repository = 'Foos-Abdullahi/uct-ums',
    [string]$Base = 'sandbox',
    [string]$Head = 'development',
    [switch]$AutoMerge,
    [int]$StatusTimeoutSeconds = 1200
)

# EAP=Continue ensures native stderr (e.g. 'git fetch' progress) is not raised as
# a terminating error. API failures are handled explicitly via try/catch.
$ErrorActionPreference = 'Continue'

function Get-Token {
    if ($env:GH_PAT) { return $env:GH_PAT }
    if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        $tok = gh auth token 2>$null
        if ($LASTEXITCODE -eq 0 -and $tok) { return $tok }
    }
    throw 'No GitHub token found. Set GH_PAT or GITHUB_TOKEN, or install the gh CLI.'
}

function Invoke-GhApi {
    param([string]$Method, [string]$Path, $Body, [string]$Token)
    $headers = @{
        Authorization = "Bearer $Token"
        'X-GitHub-Api-Version' = '2022-11-28'
        'User-Agent' = 'uct-ums-deploy'
        Accept = 'application/vnd.github+json'
    }
    $params = @{ Uri = "https://api.github.com/repos/$Repository$Path"; Method = $Method; Headers = $headers }
    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Compress -Depth 6)
        $params.ContentType = 'application/json'
    }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Stop'
    try {
        return Invoke-RestMethod @params
    } finally {
        $ErrorActionPreference = $previous
    }
}

$token = Get-Token

Write-Host "Fetching origin/$Head and origin/$Base..."
git fetch origin $Head $Base 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

$headSha = (git rev-parse "origin/$Head").Trim()
$baseSha = (git rev-parse "origin/$Base").Trim()

Write-Host "origin/$Head = $headSha"
Write-Host "origin/$Base = $baseSha"

if ($headSha -eq $baseSha) {
    Write-Host "origin/$Head and origin/$Base are identical. Nothing to deploy."
    exit 0
}

Write-Host "Looking for an existing open deploy PR..."
$open = Invoke-GhApi -Method 'GET' -Path "/pulls?state=open&head=$Head&base=$Base" -Token $token
if ($open -and $open.Count -gt 0) {
    $pr = $open[0]
    Write-Host "Reusing existing PR #$($pr.number): $($pr.html_url)"
} else {
    $pr = Invoke-GhApi -Method 'POST' -Path '/pulls' -Token $token -Body @{
        title = "Deploy $Head -> $Base"
        head = $Head
        base = $Base
        body = @'
Automated deployment PR.

CI runs the full suite here (`composer ci:check`). Merging pushes to `origin/sandbox`, which triggers the `Deploy Sandbox` workflow:

1. composer install --no-dev + npm build on the runner
2. package and upload over FTP
3. extract to /home/localuct/ums, run migrations + seeders, cache config/views
4. boot self-check (BOOT_STATUS) and clean up `_deploy`

Verify afterwards: deploy self-check output in the Actions run, then https://local.uct.so/login (admin@uct.edu / seed password).
'@
    }
    Write-Host "Created PR #$($pr.number): $($pr.html_url)"
}

if ($AutoMerge) {
    try {
        Invoke-GhApi -Method 'POST' -Path "/pulls/$($pr.number)/auto-merge" -Token $token -Body @{ merge_method = 'merge' } | Out-Null
        Write-Host 'Auto-merge enabled. The sandbox deploy will start automatically once CI passes and any required review is granted.'
    } catch {
        Write-Host "Could not enable auto-merge automatically: $($_.Exception.Message)"
        Write-Host "Open the PR and enable 'Auto merge' (or merge manually once CI is green)."
    }
}

$deadline = (Get-Date).AddSeconds($StatusTimeoutSeconds)
while ((Get-Date) -lt $deadline) {
    $checks = Invoke-GhApi -Method 'GET' -Path "/commits/$headSha/check-runs" -Token $token
    $ci = $checks.check_runs | Where-Object { $_.name -eq 'ci' } | Select-Object -First 1
    $state = $checks.check_runs | Where-Object { $_.status -ne 'completed' }
    if ($ci) {
        Write-Host ("[{0}] ci: {1}/{2}" -f (Get-Date -Format HH:mm:ss), $ci.status, $ci.conclusion)
        if ($ci.status -eq 'completed') {
            if ($ci.conclusion -eq 'success') {
                Write-Host 'CI is green. Merge the PR to deploy:'
                Write-Host $pr.html_url
                exit 0
            }
            Write-Host "CI failed (conclusion: $($ci.conclusion)). Fix the failure and re-push to $Head."
            exit 1
        }
    } else {
        Write-Host ("[{0}] ci: check not started yet" -f (Get-Date -Format HH:mm:ss))
    }
    Start-Sleep -Seconds 20
}

Write-Host 'Timed out waiting for CI. Check the PR status here:'
Write-Host $pr.html_url
exit 1