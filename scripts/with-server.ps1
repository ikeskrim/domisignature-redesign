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

# Other sessions on this machine run their own servers. A port that is already
# listening belongs to someone else: measuring it would test the wrong site,
# and stopping it afterwards would kill their work.
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Output "PORT $Port IS IN USE (PID $($busy[0].OwningProcess)) - refusing; pass -Port with a free port"
  exit 1
}

function Get-Descendants([int]$ParentId) {
  $kids = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentId" -ErrorAction SilentlyContinue
  foreach ($k in $kids) { $k.ProcessId; Get-Descendants $k.ProcessId }
}

$env:NODE_ENV = "production"
# Loopback only: without -H, next start listens on every interface, and node.exe
# is allowed inbound by the firewall here. The checks only need this machine.
$server = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npx next start -p $Port -H 127.0.0.1" `
  -PassThru -WindowStyle Hidden

try {
  $ready = $false
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 4
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
  if ($server) {
    # Stop only the tree this script started (cmd -> npx -> next and its
    # child), never whatever else happens to hold the port.
    $tree = @(Get-Descendants $server.Id) + $server.Id
    foreach ($id in $tree) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $tree -contains $_.OwningProcess } |
      ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  }
}
