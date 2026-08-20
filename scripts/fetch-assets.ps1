# Downloads every asset referenced by the live domisignature.com homepage into ./public
$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root   = Split-Path -Parent $PSScriptRoot
$html   = Get-Content (Join-Path $PSScriptRoot 'source.html') -Raw
$origin = 'https://domisignature.com'

# every /media/... or /assets/... reference, from src, href, data-src, poster AND inline style url(...)
$paths = @()
$paths += [regex]::Matches($html, '(?:src|href|data-src|poster)="(/(?:media|assets)/[^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$paths += [regex]::Matches($html, "url\('?(/(?:media|assets)/[^')]+)'?\)")               | ForEach-Object { $_.Groups[1].Value }
$paths += '/assets/favicon.ico'
$paths = $paths | Sort-Object -Unique

Write-Host "Referenced assets: $($paths.Count)"

$ok = 0; $skip = 0; $fail = @()
foreach ($p in $paths) {
    $dest = Join-Path $root ('public' + ($p -replace '/', '\'))
    $dir  = Split-Path -Parent $dest
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

    if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { $skip++; continue }

    # percent-encode only the filename segment (some names contain spaces / parentheses)
    $segments = $p.TrimStart('/').Split('/')
    $encoded  = ($segments | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $url      = "$origin/$encoded"

    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 300
        $ok++
        Write-Host ("  OK   {0,10:N0}  {1}" -f (Get-Item $dest).Length, $p)
    } catch {
        $fail += "$p  ->  $($_.Exception.Message)"
        if (Test-Path $dest) { Remove-Item $dest -Force }
        Write-Host "  FAIL $p"
    }
}

Write-Host ""
Write-Host "downloaded=$ok  already-present=$skip  failed=$($fail.Count)"
if ($fail.Count) { Write-Host "--- FAILURES ---"; $fail | ForEach-Object { Write-Host $_ } }
