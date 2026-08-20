# Runs a command against a freshly started production server, then stops it.
#
# The measurement scripts need `next start` alive for their whole run, but a
# background server started in one shell invocation does not survive into the
# next one in this environment — it is reaped, and the audit then reports a
# page of connection errors that look like site failures. Starting the server
# and running the check inside a SINGLE process tree removes that whole class
# of false result.
#
#   powershell -File scripts/with-server.ps1 -Command "npm run audit:assets"

param(
  [Parameter(Mandatory = $true)][string]$Command,
  [int]$Port = 3004,
  [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:NODE_ENV = "production"
$server = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npx next start -p $Port" `
  -PassThru -WindowStyle Hidden

try {
  $ready = $false
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 4
      if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 600 }
  }

  if (-not $ready) {
    Write-Output "SERVER FAILED TO START on port $Port"
    exit 1
  }

  Write-Output "--- server ready, running: $Command"
  & cmd.exe /c $Command
  $code = $LASTEXITCODE
  Write-Output "--- command exited $code"
  exit $code
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  # next start spawns a child; clear anything still holding the port.
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
