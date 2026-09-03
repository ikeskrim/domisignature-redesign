# Design-review loop: build for production, serve it, screenshot every route, stop.
#
# Screenshots are taken against `next start`, not `next dev` — dev recompiles on
# every edit, which makes Playwright's networkidle wait unreliable and renders
# unoptimised images. The production build also uses .next-build, so it never
# collides with a dev server someone left running.
#
# Usage: powershell -File scripts/review.ps1 round-2

param([string]$Label = "latest")

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "1/4  freeing port 3004 ..."
Get-NetTCPConnection -State Listen -LocalPort 3004 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 700

Write-Host "2/4  building ..."
npm run build 2>&1 | Select-Object -Last 6
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED"; exit 1 }

Write-Host "3/4  serving ..."
# npm on Windows is a .cmd shim — Start-Process cannot launch it directly.
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = "npm.cmd" }
$server = Start-Process -FilePath $npm -ArgumentList "start" -PassThru -NoNewWindow `
    -RedirectStandardOutput "$root\design-review\_server.log" `
    -RedirectStandardError "$root\design-review\_server.err"

# Wait for the server to answer rather than sleeping a fixed amount.
$ready = $false
foreach ($i in 1..60) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest "http://localhost:3004/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}
if (-not $ready) { Write-Host "SERVER DID NOT START"; Stop-Process -Id $server.Id -Force; exit 1 }

Write-Host "4/4  capturing '$Label' ..."
npm run shots -- $Label
$shotsExit = $LASTEXITCODE

Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -LocalPort 3004 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host "done."
exit $shotsExit
