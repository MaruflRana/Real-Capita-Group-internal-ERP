#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$StopStack
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptRoot '..')).Path
Set-Location $RepoRoot

$LiveDemoDir = Join-Path $RepoRoot '.live-demo'
$CaddyContainerName = 'real-capita-tunnel-caddy'
$CloudflaredPidPath = Join-Path $LiveDemoDir 'cloudflared.pid'
$CurrentUrlPath = Join-Path $LiveDemoDir 'current-public-url.txt'
$EnvBackupPath = Join-Path $LiveDemoDir 'env.restore.env'
$EnvPath = Join-Path $RepoRoot '.env'

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

  $argDisplay = $Arguments -join ' '
  Write-Host "> $FilePath $argDisplay" -ForegroundColor DarkGray
  & $FilePath @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $argDisplay exited with code $LASTEXITCODE."
  }
}

function Test-DockerAvailable {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    return $false
  }

  & docker version *> $null
  return ($LASTEXITCODE -eq 0)
}

function Stop-Cloudflared {
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

    Remove-Item -LiteralPath $CloudflaredPidPath -Force
  }

  $matchingProcesses = @(Get-CimInstance Win32_Process -Filter "name = 'cloudflared.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -match '\btunnel\b' -and
      $_.CommandLine -match 'http://localhost:8080'
    })

  foreach ($process in $matchingProcesses) {
    if (-not $stopped.Contains([int]$process.ProcessId)) {
      Stop-Process -Id $process.ProcessId -Force
      $stopped.Add([int]$process.ProcessId)
    }
  }

  if ($stopped.Count -eq 0) {
    return 'not running'
  }

  $stoppedStr = $stopped -join ', '
  return "stopped PID(s): $stoppedStr"
}

function Remove-CaddyProxy {
  param([bool]$DockerAvailable)

  if (-not $DockerAvailable) {
    return 'skipped because Docker is not reachable'
  }

  $containerId = (& docker ps -a --filter "name=^/$CaddyContainerName$" --format '{{.ID}}' 2>$null | Select-Object -First 1)

  if (-not $containerId) {
    return 'not found'
  }

  Invoke-CheckedCommand 'docker' @('rm', '-f', $CaddyContainerName)
  return 'removed'
}

function Wait-ComposeServicesHealthy {
  param(
    [string[]]$Services,
    [int]$TimeoutSeconds = 420
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

  throw "Timed out waiting for Compose services to become healthy after $TimeoutSeconds seconds."
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

    return [PSCustomObject]@{
      StatusCode = [int]$response.StatusCode
    }
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Wait-WebHealthyOrReachable {
  param([int]$TimeoutSeconds = 120)

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
        Write-Note "web is locally reachable with HTTP $($root.StatusCode); Docker health is $lastStatus"
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

function Restore-Env {
  if (-not (Test-Path -LiteralPath $EnvBackupPath)) {
    return $false
  }

  $backupContent = Get-Content -LiteralPath $EnvBackupPath -Raw
  $tunnelPattern = 'trycloudflare\.com'
  $tunnelizedKeys = @('WEB_APP_URL', 'API_BASE_URL', 'NEXT_PUBLIC_API_BASE_URL', 'CORS_ORIGIN')

  $staleBackupKeys = @()

  foreach ($key in $tunnelizedKeys) {
    $keyPattern = [regex]::Escape($key)
    $match = [regex]::Match($backupContent, "$keyPattern\s*=\s*(.+)")

    if ($match.Success -and $match.Groups[1].Value -match $tunnelPattern) {
      $staleBackupKeys += $key
    }
  }

  if ($staleBackupKeys.Count -gt 0) {
    $staleBackupKeysStr = $staleBackupKeys -join ', '
    Write-Host "WARNING: .live-demo/env.restore.env contains stale tunnel URLs for: $staleBackupKeysStr" -ForegroundColor Yellow
    Write-Host 'Cannot safely restore from a tunnelized backup. Removing it.' -ForegroundColor Yellow
    Remove-Item -LiteralPath $EnvBackupPath -Force
    Write-Note 'stale tunnelized backup removed; .env will not be restored from it'

    if (Test-Path -LiteralPath $CurrentUrlPath) {
      Remove-Item -LiteralPath $CurrentUrlPath -Force
    }

    $envContent = Get-Content -LiteralPath $EnvPath -Raw
    $currentStaleKeys = @()

    foreach ($key in $tunnelizedKeys) {
      $keyPattern = [regex]::Escape($key)
      $match = [regex]::Match($envContent, "$keyPattern\s*=\s*(.+)")

      if ($match.Success -and $match.Groups[1].Value -match $tunnelPattern) {
        $currentStaleKeys += $key
      }
    }

    if ($currentStaleKeys.Count -gt 0) {
      Write-Note 'current .env also contains tunnel URLs; repairing to local-dev values'

      $currentLines = @(Get-Content -LiteralPath $EnvPath)
      $repairedLines = New-Object System.Collections.Generic.List[string]

      foreach ($line in $currentLines) {
        $updated = $false

        foreach ($key in $currentStaleKeys) {
          $keyPattern = [regex]::Escape($key)

          if ($line -match "^\s*$keyPattern\s*=") {
            $localDevValue = switch ($key) {
              'WEB_APP_URL' { 'http://localhost:3000' }
              'API_BASE_URL' { 'http://localhost:3333' }
              'NEXT_PUBLIC_API_BASE_URL' { 'http://localhost:3333' }
              'CORS_ORIGIN' { 'http://localhost:3000' }
              default { 'http://localhost:3333' }
            }

            $repairedLines.Add("$key=$localDevValue")
            $updated = $true
            break
          }
        }

        if (-not $updated) {
          $repairedLines.Add($line)
        }
      }

      Set-Content -LiteralPath $EnvPath -Value $repairedLines -Encoding UTF8
      Write-Note '.env repaired to local-dev values'
      return $true
    }

    return $false
  }

  Copy-Item -LiteralPath $EnvBackupPath -Destination $EnvPath -Force
  Remove-Item -LiteralPath $EnvBackupPath -Force

  if (Test-Path -LiteralPath $CurrentUrlPath) {
    Remove-Item -LiteralPath $CurrentUrlPath -Force
  }

  return $true
}

try {
  Write-Step 'Stopping Cloudflare Quick Tunnel'
  $tunnelResult = Stop-Cloudflared
  Write-Note "tunnel: $tunnelResult"

  $dockerAvailable = Test-DockerAvailable

  Write-Step 'Removing local Caddy tunnel proxy'
  $proxyResult = Remove-CaddyProxy $dockerAvailable
  Write-Note "proxy: $proxyResult"

  Write-Step 'Restoring local .env'
  $envRestored = Restore-Env

  if ($envRestored) {
    Write-Note 'env: restored from .live-demo/env.restore.env'
  } else {
    Write-Note 'env: no .live-demo/env.restore.env backup found'
  }

  $stackResult = 'left running'

  if ($StopStack) {
    if ($dockerAvailable) {
      Write-Step 'Stopping main ERP Docker stack'
      Invoke-CheckedCommand 'docker' @('compose', 'stop')
      $stackResult = 'stopped'
    } else {
      $stackResult = 'stop skipped because Docker is not reachable'
    }
  } elseif ($envRestored -and $dockerAvailable) {
    Write-Step 'Rebuilding/recreating web and api with restored .env values'
    Invoke-CheckedCommand 'docker' @('compose', 'up', '-d', '--build', 'api', 'web')
    Wait-ComposeServicesHealthy @('api')
    Wait-WebHealthyOrReachable
    $stackResult = 'running; web/api rebuilt with restored env'
  } elseif (-not $dockerAvailable) {
    $stackResult = 'not checked because Docker is not reachable'
  }

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'REAL CAPITA ERP TEMPORARY PUBLIC DEMO STOPPED' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host "Tunnel: $tunnelResult"
  Write-Host "Proxy: $proxyResult"
  Write-Host "Env: $(if ($envRestored) { 'restored' } else { 'restore backup not found' })"
  Write-Host "ERP stack: $stackResult"
  Write-Host '============================================================' -ForegroundColor Green
} catch {
  Write-Error ('[live-demo] stop failed: ' + $_.Exception.Message)
  exit 1
}
