[CmdletBinding()]
param(
    [string]$FtpHost = $env:UMS_FTP_HOST,
    [string]$FtpUser = $env:UMS_FTP_USER,
    [string]$FtpPassword = $env:UMS_FTP_PASSWORD,
    [string]$DeployToken = $env:UMS_DEPLOY_TOKEN,
    [string]$DbPassword = $env:UMS_DB_PASSWORD,
    [string]$AppUrl = $env:UMS_APP_URL,
    [string]$DbName = $env:UMS_DB_NAME,
    [string]$DbUser = $env:UMS_DB_USER
)

$ErrorActionPreference = 'Stop'

if (-not $FtpHost) { $FtpHost = 'local.uct.so' }
if (-not $AppUrl) { $AppUrl = 'https://local.uct.so' }
if (-not $DbName) { $DbName = 'localuct_ums' }
if (-not $DbUser) { $DbUser = 'localuct_ums' }

foreach ($name in @('FtpUser', 'FtpPassword', 'DbPassword')) {
    if (-not (Get-Variable $name -ValueOnly)) {
        throw "Missing required parameter $name (set UMS_$($name.ToUpper()) or pass -$name)."
    }
}

if (-not $DeployToken) {
    $DeployToken = 'umsdep_' + -join ((48..57) + (97..122) | Get-Random -Count 20 | ForEach-Object { [char]$_ })
}

function Assert-Cmd([string]$Exe, [string]$Label) {
    if (-not (Get-Command $Exe -ErrorAction SilentlyContinue)) {
        throw "Required tool not found: $Label ($Exe)"
    }
}

foreach ($tool in @('curl.exe', 'npm', 'php', 'python', 'tar')) {
    Assert-Cmd $tool $tool
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$work = Join-Path $env:TEMP 'opencode\uct_ums_deploy'
$stage = Join-Path $work 'ums'
$web = Join-Path $work 'public_html'

if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Path $stage, $web -Force | Out-Null

Write-Host '[1/8] Building frontend assets...'
Push-Location $repoRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
} finally {
    Pop-Location
}

Write-Host '[2/8] Staging application files...'
robocopy $repoRoot $stage /E /NFL /NDL /NJH /NJS /XD .git node_modules vendor /NJH | Out-Null
robocopy (Join-Path $repoRoot 'vendor') (Join-Path $stage 'vendor') /E /NFL /NDL /NJH /NJS | Out-Null

Write-Host '[3/8] Cleaning development caches...'
foreach ($target in @(
    (Join-Path $stage 'storage\logs'),
    (Join-Path $stage 'storage\framework\cache\data'),
    (Join-Path $stage 'storage\framework\sessions'),
    (Join-Path $stage 'storage\framework\views'),
    (Join-Path $stage 'bootstrap\cache')
)) {
    if (Test-Path $target) {
        Get-ChildItem -LiteralPath $target -Force |
            Where-Object { $_.Name -ne '.gitignore' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host '[4/8] Writing production .env...'
$appKey = 'base64:' + (php -r "echo base64_encode(random_bytes(32));")

$envContent = @(Get-Content (Join-Path $repoRoot '.env.example')) |
    ForEach-Object {
        if ($_ -match '^APP_NAME=') { return 'APP_NAME="UCT Online"' }
        if ($_ -match '^APP_ENV=') { return 'APP_ENV=production' }
        if ($_ -match '^APP_DEBUG=') { return 'APP_DEBUG=false' }
        if ($_ -match '^APP_URL=') { return "APP_URL=$AppUrl" }
        if ($_ -match '^APP_KEY=') { return "APP_KEY=$appKey" }
        if ($_ -match '^DB_CONNECTION=') { return 'DB_CONNECTION=mysql' }
        if ($_ -match '^# DB_HOST=') { return 'DB_HOST=localhost' }
        if ($_ -match '^# DB_PORT=') { return 'DB_PORT=3306' }
        if ($_ -match '^# DB_DATABASE=') { return "DB_DATABASE=$DbName" }
        if ($_ -match '^# DB_USERNAME=') { return "DB_USERNAME=$DbUser" }
        if ($_ -match '^# DB_PASSWORD=') { return "DB_PASSWORD=$DbPassword" }
        if ($_ -match '^QUEUE_CONNECTION=') { return 'QUEUE_CONNECTION=sync' }
        if ($_ -match '^CACHE_STORE=') { return 'CACHE_STORE=file' }
        if ($_ -match '^MAIL_MAILER=') { return 'MAIL_MAILER=log' }
        if ($_ -match '^LOG_LEVEL=') { return 'LOG_LEVEL=error' }
        $_
    }

[System.IO.File]::WriteAllText(
    (Join-Path $stage '.env'),
    ($envContent -join "`r`n"),
    [System.Text.Encoding]::ASCII
)

Write-Host '[5/8] Building web root payload...'
robocopy (Join-Path $stage 'public') $web /E /NFL /NDL /NJH /NJS /XF index.php .htaccess | Out-Null

$connector = @'
<?php

// Front controller for the UCT Online Management System (sandbox).
// Boots the Laravel application stored outside the web root.

require __DIR__.'/../ums/public/index.php';
'@

$htaccess = @'
# Use PHP 8.4 for this application (Laravel 13 requires PHP >= 8.4.1).
AddHandler application/x-httpd-php84 .php

<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Redirect all requests to HTTPS
    RewriteCond %{HTTPS} off
    RewriteCond %{HTTP:X-Forwarded-Proto} !https
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
'@

$extractor = @"
<?php

use PharData;

`$token = '$DeployToken';

if ((`$_GET['token'] ?? '') !== `$token) {
    http_response_code(403);
    exit('forbidden');
}

`$home = '/home/localuct';
`$archive = `$home.'/ums_deploy.tar.gz';
`$target = `$home.'/ums';

if (!file_exists(`$archive)) {
    exit('ERR archive not found');
}

function rrmdir(string `$dir): void
{
    if (!is_dir(`$dir)) {
        return;
    }

    `$items = scandir(`$dir);

    foreach (`$items as `$item) {
        if (`$item === '.' || `$item === '..') {
            continue;
        }

        `$path = `$dir.'/' . `$item;

        is_dir(`$path) ? rrmdir(`$path) : @unlink(`$path);
    }

    @rmdir(`$dir);
}

rrmdir(`$target);

`$public = `$home.'/public_html';
foreach (scandir(`$public) ?: [] as `$item) {
    if (`$item === '.' || `$item === '..' || `$item === '_deploy') {
        continue;
    }

    `$path = `$public.'/' . `$item;

    is_dir(`$path) ? rrmdir(`$path) : @unlink(`$path);
}

try {
    `$phar = new PharData(`$archive);
    `$phar->extractTo(`$home, null, true);
} catch (Throwable `$e) {
    http_response_code(500);
    exit('ERR extract: '.`$e->getMessage());
}

if (!is_dir(`$target) || !is_file(`$target.'/artisan')) {
    http_response_code(500);
    exit('ERR extraction incomplete');
}

echo 'OK extracted';
"@

$runner = @"
<?php

use Illuminate\Contracts\Console\Kernel;

`$token = '$DeployToken';

if ((`$_GET['token'] ?? '') !== `$token) {
    http_response_code(403);
    exit('forbidden');
}

`$base = '/home/localuct/ums';

if (! is_file(`$base.'/artisan') || ! is_file(`$base.'/vendor/autoload.php')) {
    http_response_code(500);
    exit('ERR application not deployed, run extractor first');
}

chdir(`$base);

require `$base.'/vendor/autoload.php';

`$app = require_once `$base.'/bootstrap/app.php';

`$console = `$app->make(Kernel::class);

`$commands = ['config:clear', 'migrate --force', 'db:seed --class=AdminSeeder --force', 'db:seed --class=RolePermissionSeeder --force', 'db:seed --class=ChartOfAccountsSeeder --force', 'config:cache', 'view:cache'];

foreach (`$commands as `$command) {
    echo ">>> {`$command}\n\n";

    try {
        `$status = `$console->call(`$command);
        `$output = `$console->output();
        echo `$output;

        if (`$status !== 0) {
            echo "\n[FAILED status={`$status}]\n";
            http_response_code(500);
            exit;
        }
    } catch (Throwable `$e) {
        echo 'ERR '.`$e->getMessage()."\n".`$e->getTraceAsString();
        http_response_code(500);
        exit;
    }

    echo "[ok]\n\n";
}

echo 'DONE';
"@

foreach ($file in @(
    @{ Path = (Join-Path $web 'index.php'); Content = $connector },
    @{ Path = (Join-Path $web '.htaccess'); Content = $htaccess }
)) {
    [System.IO.File]::WriteAllText($file.Path, $file.Content, [System.Text.Encoding]::ASCII)
}

New-Item -ItemType Directory -Path (Join-Path $web '_deploy') -Force | Out-Null
foreach ($file in @(
    @{ Path = (Join-Path $web '_deploy\ums_extract.php'); Content = $extractor },
    @{ Path = (Join-Path $web '_deploy\ums_run.php'); Content = $runner }
)) {
    [System.IO.File]::WriteAllText($file.Path, $file.Content, [System.Text.Encoding]::ASCII)
}

Write-Host '[6/8] Packaging archive...'
$workGz = Join-Path $work 'deploy.tar.gz'
Push-Location $work
try {
    tar -zcf $workGz -C $work ums public_html
    if ($LASTEXITCODE -ne 0) { throw 'tar gzip failed' }
} finally {
    Pop-Location
}

$ftpUrl = "ftp://$FtpHost"

function Invoke-FtpUpload([string]$Local, [string]$Remote) {
    curl.exe -s -m 1800 -o NUL --ftp-create-dirs -u "${FtpUser}:${FtpPassword}" -T $Local "$ftpUrl/$Remote"
    if ($LASTEXITCODE -ne 0) { throw "FTP upload failed: $Remote" }
}

function Invoke-FtpDelete([string]$Command) {
    curl.exe -s -o NUL -u "${FtpUser}:${FtpPassword}" --ftp-method nocwd "$ftpUrl/" -Q $Command
}

Write-Host '[7/8] Uploading, extracting, migrating...'
Invoke-FtpUpload (Join-Path $web '_deploy\ums_extract.php') 'public_html/_deploy/ums_extract.php'
Invoke-FtpUpload (Join-Path $web '_deploy\ums_run.php') 'public_html/_deploy/ums_run.php'
Invoke-FtpUpload (Join-Path $web '.htaccess') 'public_html/.htaccess'
Invoke-FtpUpload $workGz 'ums_deploy.tar.gz'

$extractOut = curl.exe -sL "https://$FtpHost/_deploy/ums_extract.php?token=$DeployToken" -m 600
if ($extractOut -notmatch 'OK extracted') { throw "Extraction failed: $extractOut" }
Write-Host 'Extracted OK.'

$runOut = curl.exe -sL "https://$FtpHost/_deploy/ums_run.php?token=$DeployToken" -m 900
if ($runOut -notmatch 'DONE') { throw "Artisan runner failed: $runOut" }
Write-Host $runOut

Write-Host '[8/8] Cleaning up...'
Invoke-FtpDelete 'DELE public_html/_deploy/ums_extract.php'
Invoke-FtpDelete 'DELE public_html/_deploy/ums_run.php'
Invoke-FtpDelete 'RMD public_html/_deploy'
Invoke-FtpDelete 'DELE ums_deploy.tar.gz'
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue

$check = curl.exe -s -o NUL -w "%{http_code}" "$AppUrl/" -m 30
Write-Host "Deploy complete. $AppUrl -> HTTP $check (expect 200 or 302)."