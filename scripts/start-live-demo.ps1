#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$HealthTimeoutSeconds = 420,
  [int]$TunnelTimeoutSeconds = 120
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptRoot '..')).Path
Set-Location $RepoRoot

$LiveDemoDir = Join-Path $RepoRoot '.live-demo'
$CaddyContainerName = 'real-capita-tunnel-caddy'
$CaddyImage = 'caddy:2.10-alpine'
$ProxyUrl = 'http://localhost:8080'
$CloudflaredPidPath = Join-Path $LiveDemoDir 'cloudflared.pid'
$CloudflaredStdoutPath = Join-Path $LiveDemoDir 'cloudflared.stdout.log'
$CloudflaredStderrPath = Join-Path $LiveDemoDir 'cloudflared.stderr.log'
$CurrentUrlPath = Join-Path $LiveDemoDir 'current-public-url.txt'
$EnvBackupPath = Join-Path $LiveDemoDir 'env.restore.env'
$EnvPath = Join-Path $RepoRoot '.env'
$CaddyfilePath = Join-Path $LiveDemoDir 'Caddyfile'
$RequiredServices = @('postgres', 'minio', 'api', 'web')
$TunnelEnvKeys = @(
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'WEB_APP_URL',
  'API_BASE_URL',
  'CORS_ORIGIN'
)

function Write-Step {
  param([string]$Message)
  Write-Host ''
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Note {
  param([string]$Message)
  Write-Host "[live-demo] $Message"
}

function Invoke-CheckedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
  & $FilePath @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') exited with code $LASTEXITCODE."
  }
}

function Invoke-CapturedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  $output = & $FilePath @Arguments 2>&1

  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') exited with code $LASTEXITCODE. $output"
  }

  return $output
}

function Resolve-CloudflaredPath {
  $pathCommand = Get-Command cloudflared -ErrorAction SilentlyContinue

  if ($pathCommand) {
    return $pathCommand.Source
  }

  $standardPath = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'

  if (Test-Path -LiteralPath $standardPath) {
    return $standardPath
  }

  throw 'cloudflared was not found on PATH or at C:\Program Files (x86)\cloudflared\cloudflared.exe. Install Cloudflare Tunnel and rerun this script.'
}

function Assert-Prerequisites {
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot 'docker-compose.yml'))) {
    throw 'Run this script from the Real Capita ERP repository, or keep it under the repository scripts folder.'
  }

  if (-not (Test-Path -LiteralPath $EnvPath)) {
    throw 'Missing .env. Create it before starting a temporary live demo.'
  }

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install Docker Desktop and make sure docker is available on PATH.'
  }

  Invoke-CapturedCommand 'docker' @('version') | Out-Null
  Invoke-CapturedCommand 'docker' @('compose', 'version') | Out-Null

  $cloudflaredPath = Resolve-CloudflaredPath
  Write-Note "cloudflared: $cloudflaredPath"

  return $cloudflaredPath
}

function Stop-ExistingCloudflared {
  $stopped = New-Object System.Collections.Generic.List[int]

  if (Test-Path -LiteralPath $CloudflaredPidPath) {
    $pidText = (Get-Content -LiteralPath $CloudflaredPidPath -Raw).Trim()
    $processId = 0

    if ([int]::TryParse($pidText, [ref]$processId)) {
      $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

      if ($process) {
        Stop-Process -Id $processId -Force
        $stopped.Add($processId)
      }
    }
  }

  $matchingProcesses = Get-CimInstance Win32_Process -Filter "name = 'cloudflared.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -match '\btunnel\b' -and
      $_.CommandLine -match 'http://localhost:8080'
    }

  foreach ($process in $matchingProcesses) {
    if (-not $stopped.Contains([int]$process.ProcessId)) {
      Stop-Process -Id $process.ProcessId -Force
      $stopped.Add([int]$process.ProcessId)
    }
  }

  if (Test-Path -LiteralPath $CloudflaredPidPath) {
    Remove-Item -LiteralPath $CloudflaredPidPath -Force
  }

  if ($stopped.Count -gt 0) {
    Write-Note "stopped old cloudflared process(es): $($stopped -join ', ')"
  }
}

function Remove-CaddyProxy {
  $containerId = (& docker ps -a --filter "name=^/$CaddyContainerName$" --format '{{.ID}}' 2>$null | Select-Object -First 1)

  if ($containerId) {
    Invoke-CheckedCommand 'docker' @('rm', '-f', $CaddyContainerName)
  }
}

function Wait-ComposeServicesHealthy {
  param(
    [string[]]$Services,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastStatusLine = ''

  while ((Get-Date) -lt $deadline) {
    $statuses = New-Object System.Collections.Generic.List[string]
    $allHealthy = $true

    foreach ($service in $Services) {
      $containerId = (& docker compose ps -q $service 2>$null | Select-Object -First 1)

      if (-not $containerId) {
        $statuses.Add("${service}=missing")
        $allHealthy = $false
        continue
      }

      $health = (& docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId 2>$null | Select-Object -First 1)

      if (-not $health) {
        $health = 'unknown'
      }

      $statuses.Add("${service}=${health}")

      if ($health -ne 'healthy') {
        $allHealthy = $false
      }
    }

    $statusLine = $statuses -join ', '

    if ($statusLine -ne $lastStatusLine) {
      Write-Note "health: $statusLine"
      $lastStatusLine = $statusLine
    }

    if ($allHealthy) {
      return
    }

    Start-Sleep -Seconds 5
  }

  docker compose ps
  throw "Timed out waiting for Compose services to become healthy after $TimeoutSeconds seconds."
}

function Wait-WebHealthyOrReachable {
  param([int]$TimeoutSeconds)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastStatus = 'unknown'
  $lastReachability = 'No response received yet.'

  while ((Get-Date) -lt $deadline) {
    $containerId = (& docker compose ps -q web 2>$null | Select-Object -First 1)

    if ($containerId) {
      $health = (& docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId 2>$null | Select-Object -First 1)

      if ($health) {
        $lastStatus = $health
      }

      if ($health -eq 'healthy') {
        Write-Note 'health: web=healthy'
        return
      }
    }

    try {
      $root = Invoke-NoRedirectRequest 'http://localhost:3000/'

      if ($root.StatusCode -ge 200 -and $root.StatusCode -lt 400) {
        Write-Note "web is locally reachable with HTTP $($root.StatusCode); Docker health is $lastStatus until the fresh tunnel URL is rebuilt"
        return
      }

      $lastReachability = "HTTP $($root.StatusCode)"
    } catch {
      $lastReachability = $_.Exception.Message
    }

    Start-Sleep -Seconds 5
  }

  throw "Web did not become healthy or locally reachable after $TimeoutSeconds seconds. Last Docker health: $lastStatus. Last local response: $lastReachability"
}

function Write-Caddyfile {
  $content = @'
:80 {
  handle /api/* {
    reverse_proxy host.docker.internal:3333 {
      header_up Host {host}
      header_up X-Forwarded-Host {host}
      header_up X-Forwarded-Proto https
    }
  }

  handle {
    reverse_proxy host.docker.internal:3000 {
      header_up Host {host}
      header_up X-Forwarded-Host {host}
      header_up X-Forwarded-Proto https
    }
  }
}
'@

  Set-Content -LiteralPath $CaddyfilePath -Value $content.TrimEnd() -Encoding ASCII
}

function Wait-LocalProxy {
  $deadline = (Get-Date).AddSeconds(60)
  $lastError = 'No response received yet.'

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri "$ProxyUrl/api/v1/health" -UseBasicParsing -TimeoutSec 10

      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return
      }

      $lastError = "HTTP $($response.StatusCode)"
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds 2
  }

  throw "Caddy proxy did not respond at $ProxyUrl within 60 seconds: $lastError"
}

function Start-CaddyProxy {
  Remove-CaddyProxy
  Write-Caddyfile

  Invoke-CheckedCommand 'docker' @(
    'run',
    '-d',
    '--name',
    $CaddyContainerName,
    '-p',
    '8080:80',
    '-v',
    "${CaddyfilePath}:/etc/caddy/Caddyfile:ro",
    $CaddyImage
  )

  Wait-LocalProxy
}

function Read-CloudflaredLogs {
  $content = ''

  foreach ($path in @($CloudflaredStdoutPath, $CloudflaredStderrPath)) {
    if (Test-Path -LiteralPath $path) {
      try {
        $content = "$content`n$(Get-Content -LiteralPath $path -Raw)"
      } catch {
        $content = "$content`n"
      }
    }
  }

  return $content
}

function Start-QuickTunnel {
  param([string]$CloudflaredPath)

  Remove-Item -LiteralPath $CloudflaredStdoutPath, $CloudflaredStderrPath, $CurrentUrlPath -Force -ErrorAction SilentlyContinue

  $process = Start-Process `
    -FilePath $CloudflaredPath `
    -ArgumentList @('tunnel', '--url', $ProxyUrl) `
    -RedirectStandardOutput $CloudflaredStdoutPath `
    -RedirectStandardError $CloudflaredStderrPath `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -LiteralPath $CloudflaredPidPath -Value ([string]$process.Id) -Encoding ASCII

  $deadline = (Get-Date).AddSeconds($TunnelTimeoutSeconds)
  $urlPattern = 'https://[a-z0-9-]+\.trycloudflare\.com'

  while ((Get-Date) -lt $deadline) {
    $logs = Read-CloudflaredLogs
    $match = [regex]::Match($logs, $urlPattern)

    if ($match.Success) {
      $publicUrl = $match.Value
      Set-Content -LiteralPath $CurrentUrlPath -Value $publicUrl -Encoding ASCII
      return $publicUrl
    }

    if (-not (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
      throw "cloudflared exited before a public URL was detected. Check $CloudflaredStderrPath."
    }

    Start-Sleep -Seconds 2
  }

  throw "Timed out waiting for a trycloudflare.com URL. Check $CloudflaredStderrPath."
}

function Backup-EnvIfNeeded {
  if (-not (Test-Path -LiteralPath $EnvBackupPath)) {
    Copy-Item -LiteralPath $EnvPath -Destination $EnvBackupPath -Force
    Write-Note 'created .env restore backup in .live-demo/'
    return
  }

  Write-Note 'using existing .live-demo .env restore backup'
}

function Set-TunnelEnvValues {
  param([string]$PublicUrl)

  Backup-EnvIfNeeded

  $lines = @(Get-Content -LiteralPath $EnvPath)
  $nextLines = New-Object System.Collections.Generic.List[string]
  $seen = @{}

  foreach ($line in $lines) {
    $updated = $false

    foreach ($key in $TunnelEnvKeys) {
      $keyPattern = [regex]::Escape($key)

      if ($line -match "^\s*$keyPattern\s*=") {
        $nextLines.Add("$key=$PublicUrl")
        $seen[$key] = $true
        $updated = $true
        break
      }
    }

    if (-not $updated) {
      $nextLines.Add($line)
    }
  }

  $missingKeys = @($TunnelEnvKeys | Where-Object { -not $seen.ContainsKey($_) })

  if ($missingKeys.Count -gt 0) {
    $nextLines.Add('')
    $nextLines.Add('# Temporary live demo public URL values')

    foreach ($key in $missingKeys) {
      $nextLines.Add("$key=$PublicUrl")
    }
  }

  Set-Content -LiteralPath $EnvPath -Value $nextLines -Encoding UTF8
}

function Invoke-NoRedirectRequest {
  param([string]$Url)

  Add-Type -AssemblyName System.Net.Http

  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $false
  $client = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(30)

  try {
    $response = $client.GetAsync($Url).GetAwaiter().GetResult()
    $location = $null

    if ($response.Headers.Location) {
      $location = $response.Headers.Location.ToString()
    }

    return [PSCustomObject]@{
      StatusCode = [int]$response.StatusCode
      Location = $location
    }
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Wait-PublicLogin {
  param([string]$PublicUrl)

  $deadline = (Get-Date).AddSeconds(120)
  $lastError = 'No response received yet.'

  while ((Get-Date) -lt $deadline) {
    try {
      $root = Invoke-NoRedirectRequest $PublicUrl

      if ($root.Location -and $root.Location -match 'localhost|127\.0\.0\.1|\[::1\]') {
        throw "Root redirected to a local-only URL: $($root.Location)"
      }

      if ($root.StatusCode -lt 200 -or $root.StatusCode -ge 400) {
        throw "Root returned HTTP $($root.StatusCode)."
      }

      $loginResponse = Invoke-WebRequest -Uri "$PublicUrl/login" -UseBasicParsing -TimeoutSec 30

      if ($loginResponse.StatusCode -ge 200 -and $loginResponse.StatusCode -lt 300 -and $loginResponse.Content -match 'Real Capita ERP') {
        return [PSCustomObject]@{
          RootStatusCode = $root.StatusCode
          RootLocation = $root.Location
          LoginStatusCode = $loginResponse.StatusCode
        }
      }

      $lastError = "Login page returned HTTP $($loginResponse.StatusCode), but the Real Capita ERP page marker was not detected."
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds 3
  }

  throw "Public tunnel did not verify within 120 seconds: $lastError"
}

try {
  New-Item -ItemType Directory -Force -Path $LiveDemoDir | Out-Null

  Write-Step 'Checking prerequisites'
  $cloudflaredPath = Assert-Prerequisites

  Write-Step 'Stopping previous temporary tunnel artifacts'
  Stop-ExistingCloudflared
  Remove-CaddyProxy

  Write-Step 'Starting Real Capita ERP Docker stack'
  Invoke-CheckedCommand 'docker' @('compose', 'up', '-d', '--build')
  Wait-ComposeServicesHealthy @('postgres', 'minio', 'api') $HealthTimeoutSeconds
  Wait-WebHealthyOrReachable 120

  Write-Step 'Starting local Caddy tunnel proxy on http://localhost:8080'
  Start-CaddyProxy

  Write-Step 'Starting Cloudflare Quick Tunnel'
  $publicUrl = Start-QuickTunnel $cloudflaredPath
  Write-Note "captured public URL: $publicUrl"

  Write-Step 'Updating temporary local .env URL values'
  Set-TunnelEnvValues $publicUrl
  Write-Note 'updated only NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_BASE_URL, WEB_APP_URL, API_BASE_URL, and CORS_ORIGIN'

  Write-Step 'Rebuilding/recreating web and api for the current tunnel URL'
  Invoke-CheckedCommand 'docker' @('compose', 'up', '-d', '--build', 'api', 'web')
  Wait-ComposeServicesHealthy @('api', 'web') $HealthTimeoutSeconds

  Write-Step 'Verifying public tunnel login page'
  $verification = Wait-PublicLogin $publicUrl
  Write-Note "root status: HTTP $($verification.RootStatusCode), location: $($verification.RootLocation)"
  Write-Note "login page status: HTTP $($verification.LoginStatusCode)"

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'REAL CAPITA ERP TEMPORARY PUBLIC DEMO IS LIVE' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host "PUBLIC DEMO URL: $publicUrl" -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Keep these running during the demo:'
  Write-Host '- Docker Desktop'
  Write-Host '- docker compose services: web, api, postgres, minio'
  Write-Host "- Caddy proxy container: $CaddyContainerName"
  Write-Host "- cloudflared process PID: $((Get-Content -LiteralPath $CloudflaredPidPath -Raw).Trim())"
  Write-Host ''
  Write-Host 'Manual next step: open the public URL and sign in with the existing demo credentials.'
  Write-Host 'The Quick Tunnel URL changes after every fresh run.'
  Write-Host 'Known caveat: MinIO-backed direct upload/download links may remain local-only because S3_PUBLIC_ENDPOINT is not tunneled.'
  Write-Host ''
  Write-Host 'Stop later with:'
  Write-Host 'powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1'
  Write-Host '============================================================' -ForegroundColor Green
} catch {
  Write-Error "[live-demo] failed: $($_.Exception.Message)"
  Write-Host ''
  Write-Host 'Troubleshooting files are under .live-demo/. To clean up, run:'
  Write-Host 'powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1'
  exit 1
}
