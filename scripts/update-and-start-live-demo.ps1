#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$RefreshDemoData,
  [string]$DemoEmail = 'admin@realcapita.com.bd',
  [string]$DemoPassword = 'rcg-uat-2026-password',
  [int]$HealthTimeoutSeconds = 420,
  [int]$LoginTimeoutSeconds = 60
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptRoot '..')).Path
Set-Location $RepoRoot

$EnvPath = Join-Path $RepoRoot '.env'
$ApiHealthUrl = 'http://localhost:3333/api/v1/health'
$ApiLoginUrl = 'http://localhost:3333/api/v1/auth/login'
$Port3000 = 3000
$StartDemoScript = Join-Path $ScriptRoot 'start-live-demo.ps1'

function Write-Step {
  param([string]$Message)
  Write-Host ''
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Note {
  param([string]$Message)
  Write-Host "[update-demo] $Message"
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

function Invoke-CapturedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  $output = & $FilePath @Arguments 2>&1

  if ($LASTEXITCODE -ne 0) {
    $argDisplay = $Arguments -join ' '
    throw "$FilePath $argDisplay exited with code $LASTEXITCODE. $output"
  }

  return $output
}

function Assert-GitClean {
  $statusLines = Invoke-CapturedCommand 'git' @('status', '--short')

  $modified = @($statusLines | Where-Object {
    $_ -match '^\s*M' -or $_ -match '^\s*A' -or $_ -match '^\s*R' -or $_ -match '^\s*D'
  })

  if ($modified.Count -gt 0) {
    Write-Host "Modified/staged files found:" -ForegroundColor Red
    $modified | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    throw 'Repository has tracked modifications. Resolve them before running this script.'
  }

  $untracked = @($statusLines | Where-Object { $_ -match '^\s*\?\?' })

  if ($untracked.Count -gt 0) {
    Write-Note "untracked local files detected (not blocking):"
    $untracked | ForEach-Object { Write-Note "  $_" }
  }

  Write-Note 'git repository is clean for safe fast-forward pull'
}

function Pull-LatestCode {
  Write-Note 'pulling latest code from origin/main (fast-forward only)'
  Invoke-CheckedCommand 'git' @('pull', '--ff-only', 'origin', 'main')
  Write-Note 'pull completed successfully'
}

function Stop-LeftoverDevServer {
  $devServerCandidates = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -match 'next dev|nx run web:dev|pnpm dev:web'
    })

  if ($devServerCandidates.Count -eq 0) {
    Write-Note 'no leftover ERP dev-server process found on port 3000'
    return
  }

  foreach ($candidate in $devServerCandidates) {
    $procId = [int]$candidate.ProcessId
    $processName = $candidate.Name
    $commandLine = $candidate.CommandLine

    Write-Note "stopping known ERP dev-server process PID $procId ($processName): $commandLine"
    Stop-Process -Id $procId -Force
    Start-Sleep -Seconds 3

    $stillRunning = Get-Process -Id $procId -ErrorAction SilentlyContinue

    if ($stillRunning) {
      throw "Could not stop dev server PID $procId after 3 seconds."
    }

    Write-Note "dev server PID $procId stopped successfully"
  }

  $unknownOnPort3000 = @(netstat -ano |
    Select-String ":$Port3000 " |
    Select-String "LISTENING")

  if ($unknownOnPort3000.Count -gt 0) {
    foreach ($line in $unknownOnPort3000) {
      $parts = $line.ToString().Trim() -split '\s+'
      $procId = [int]$parts[-1]

      $process = Get-Process -Id $procId -ErrorAction SilentlyContinue

      if (-not $process) {
        continue
      }

      $processName = $process.ProcessName
      $commandLine = ''

      try {
        $cimProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
        if ($cimProcess) {
          $commandLine = $cimProcess.CommandLine
        }
      } catch {
        $commandLine = '(unable to read command line)'
      }

      $isDockerProxy = $processName -match 'com\.docker|docker|wslrelay|vpnkit'

      if ($isDockerProxy) {
        Write-Note "port 3000 listener PID $procId ($processName) is a Docker proxy - not blocking"
        continue
      }

      Write-Host "Port 3000 is occupied by an unknown non-Docker process:" -ForegroundColor Red
      Write-Host "  PID: $procId" -ForegroundColor Red
      Write-Host "  Name: $processName" -ForegroundColor Red
      Write-Host "  Command: $commandLine" -ForegroundColor Red
      throw "Port 3000 is occupied by an unknown non-Docker process (PID $procId). Stop it manually before running this script."
    }
  }
}

function Normalize-EnvForLocalhost {
  if (-not (Test-Path -LiteralPath $EnvPath)) {
    throw 'Missing .env file. Create it before running this script.'
  }

  $envContent = Get-Content -LiteralPath $EnvPath -Raw
  $tunnelPattern = 'trycloudflare\.com'

  $tunnelizedKeys = @('WEB_APP_URL', 'API_BASE_URL', 'NEXT_PUBLIC_API_BASE_URL', 'CORS_ORIGIN')

  $staleKeys = @()

  foreach ($key in $tunnelizedKeys) {
    $keyPattern = [regex]::Escape($key)
    $match = [regex]::Match($envContent, "$keyPattern\s*=\s*(.+)")

    if ($match.Success -and $match.Groups[1].Value -match $tunnelPattern) {
      $staleKeys += $key
    }
  }

  if ($staleKeys.Count -gt 0) {
    $staleKeysStr = $staleKeys -join ', '
    Write-Note "detected stale tunnel URLs in .env for keys: $staleKeysStr"

    $envExamplePath = Join-Path $RepoRoot '.env.example'

    if (-not (Test-Path -LiteralPath $envExamplePath)) {
      throw '.env.example not found. Cannot repair stale tunnel URLs automatically.'
    }

    $exampleContent = @(Get-Content -LiteralPath $envExamplePath)
    $currentLines = @(Get-Content -LiteralPath $EnvPath)
    $repairedLines = New-Object System.Collections.Generic.List[string]
    $repaired = @{}

    foreach ($line in $currentLines) {
      $updated = $false

      foreach ($key in $staleKeys) {
        $keyPattern = [regex]::Escape($key)

        if ($line -match "^\s*$keyPattern\s*=") {
          $exampleLine = @($exampleContent | Where-Object { $_ -match "^\s*$keyPattern\s*=" }) | Select-Object -First 1

          if ($exampleLine) {
            $exampleValue = ($exampleLine -split '=', 2)[1]

            if ($exampleValue -match 'localhost|127\.0\.0\.1|placeholder|change-me') {
              $localDevValue = switch ($key) {
                'WEB_APP_URL' { 'http://localhost:3000' }
                'API_BASE_URL' { 'http://localhost:3333' }
                'NEXT_PUBLIC_API_BASE_URL' { 'http://localhost:3333' }
                'CORS_ORIGIN' { 'http://localhost:3000' }
                default { $exampleValue }
              }

              $repairedLines.Add("$key=$localDevValue")
            } else {
              $repairedLines.Add($exampleLine)
            }

            $repaired[$key] = $true
            $updated = $true
            break
          }
        }
      }

      if (-not $updated) {
        $repairedLines.Add($line)
      }
    }

    Set-Content -LiteralPath $EnvPath -Value $repairedLines -Encoding UTF8
    Write-Note "repaired .env: replaced stale tunnel URLs with local-dev values"
  } else {
    Write-Note '.env URL keys are already set to non-tunnel values'
  }
}

function Rebuild-DockerStack {
  Write-Note 'rebuilding Docker Compose stack with current .env'
  Invoke-CheckedCommand 'docker' @('compose', 'up', '-d', '--build')
  Write-Note 'waiting for API health after initial build'

  $apiHealthy = Test-ApiHealth $HealthTimeoutSeconds

  if (-not $apiHealthy) {
    throw 'API did not become healthy within the timeout.'
  }

  Write-Note 'recreating api and web with current env values'
  Invoke-CheckedCommand 'docker' @('compose', 'up', '-d', '--force-recreate', '--build', 'api', 'web')

  $apiHealthy2 = Test-ApiHealth 120

  if (-not $apiHealthy2) {
    throw 'API did not become healthy after recreate within 120 seconds.'
  }

  Write-Note 'Docker stack rebuilt and healthy'
}

function Test-ApiHealth {
  param([int]$TimeoutSeconds = 60)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $ApiHealthUrl -UseBasicParsing -TimeoutSec 10

      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        $body = $response.Content | ConvertFrom-Json

        if ($body.status -eq 'ok') {
          Write-Note "API health: $($body.status) (uptime $($body.checks.runtime.summary))"
          return $true
        }
      }
    } catch {
      Start-Sleep -Seconds 3
      continue
    }

    Start-Sleep -Seconds 3
  }

  return $false
}

function Verify-DemoData {
  if ($RefreshDemoData) {
    Write-Step 'Reseeding realistic UAT data (requested with -RefreshDemoData)'
    $previousUatPassword = $env:UAT_PASSWORD
    $env:UAT_PASSWORD = $DemoPassword

    try {
      Invoke-CheckedCommand 'corepack' @('pnpm', 'seed:realistic:uat')
    } finally {
      if ($null -eq $previousUatPassword) {
        Remove-Item Env:\UAT_PASSWORD -ErrorAction SilentlyContinue
      } else {
        $env:UAT_PASSWORD = $previousUatPassword
      }
    }

    Write-Note 'realistic UAT data reseeded'
  }

  Write-Step 'Verifying realistic UAT data'
  $verifyOutput = Invoke-CapturedCommand 'corepack' @('pnpm', 'seed:realistic:verify')

  if ($verifyOutput -match 'All checks passed') {
    Write-Note 'realistic UAT data verification passed'
  } else {
    if (-not $RefreshDemoData) {
      Write-Host 'Realistic UAT data verification FAILED.' -ForegroundColor Red
      Write-Host 'The realistic UAT seed data appears incomplete or stale.' -ForegroundColor Red
      Write-Host 'Rerun this script with -RefreshDemoData to reseed fresh realistic UAT data.' -ForegroundColor Yellow
      throw 'Realistic UAT data verification failed. Rerun with -RefreshDemoData to fix.'
    }

    throw 'Realistic UAT data verification failed even after reseeding. Check the seed:realistic:verify output above.'
  }
}

function Test-DemoLogin {
  param(
    [string]$BaseUrl = $ApiLoginUrl,
    [string]$Email = $DemoEmail,
    [string]$Password = $DemoPassword
  )

  Write-Note "testing UAT login at $BaseUrl with email $Email"

  Add-Type -AssemblyName System.Net.Http

  $handler = New-Object System.Net.Http.HttpClientHandler
  $client = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(30)

  $body = '{"email":"' + $Email + '","password":"' + $Password + '"}'
  $content = New-Object System.Net.Http.StringContent($body, [System.Text.Encoding]::UTF8, 'application/json')

  try {
    $response = $client.PostAsync($BaseUrl, $content).GetAwaiter().GetResult()
    $statusCode = [int]$response.StatusCode
    $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

    if ($statusCode -eq 201 -or $statusCode -eq 200) {
      $parsed = $responseBody | ConvertFrom-Json

      if ($parsed.user -and $parsed.user.email -eq $Email) {
        Write-Note "UAT login verified: HTTP $statusCode, user $($parsed.user.email), company $($parsed.user.currentCompany.name)"
        return $true
      }

      Write-Note "UAT login returned HTTP $statusCode but unexpected response structure"
      return $false
    }

    Write-Host "UAT login FAILED at $BaseUrl" -ForegroundColor Red
    Write-Host "  HTTP status: $statusCode" -ForegroundColor Red
    Write-Host "  Response: $responseBody" -ForegroundColor Red

    if ($statusCode -eq 400 -and $responseBody -match 'availableCompanies') {
      Write-Host '  The user has multiple company assignments. The login requires a companyId parameter.' -ForegroundColor Yellow
      Write-Host '  This is expected behavior for multi-company accounts but not for the default UAT admin.' -ForegroundColor Yellow
    }

    return $false
  } catch {
    Write-Host "UAT login FAILED: network/CORS error at $BaseUrl" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  This typically indicates a CORS_ORIGIN mismatch between the browser/API origin and the .env configuration.' -ForegroundColor Yellow
    return $false
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

try {
  Write-Step 'Checking git repository state'
  Assert-GitClean

  Write-Step 'Pulling latest code'
  Pull-LatestCode

  Write-Step 'Checking for port 3000 conflicts'
  Stop-LeftoverDevServer

  Write-Step 'Normalizing .env for local-dev baseline'
  Normalize-EnvForLocalhost

  Write-Step 'Rebuilding Docker stack with normalized env'
  Rebuild-DockerStack

  Write-Step 'Verifying API health'
  $apiOk = Test-ApiHealth 120

  if (-not $apiOk) {
    throw 'API health check failed after Docker rebuild.'
  }

  Write-Note 'API is healthy'

  Write-Step 'Verifying realistic UAT data'
  Verify-DemoData

  Write-Step 'Verifying local UAT login'
  $loginOk = Test-DemoLogin

  if (-not $loginOk) {
    throw 'Local UAT login verification failed. The runtime is not ready for a live demo tunnel.'
  }

  Write-Note 'Local UAT login verified successfully'

  Write-Step 'Starting Cloudflare live demo tunnel'
  $scriptArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $StartDemoScript,
    '-SkipInitialBuild',
    '-DemoEmail', $DemoEmail,
    '-DemoPassword', $DemoPassword
  )

  $scriptArgsDisplay = $scriptArgs -join ' '
  Write-Note "calling: powershell $scriptArgsDisplay"
  & powershell @scriptArgs

  if ($LASTEXITCODE -ne 0) {
    throw 'start-live-demo.ps1 exited with a non-zero code. Check its output above for details.'
  }

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'UPDATE AND LIVE DEMO COMPLETE' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'The ERP has been updated, rebuilt, verified, and the live' -ForegroundColor Green
  Write-Host 'demo tunnel has been launched. See the output above for' -ForegroundColor Green
  Write-Host 'the public demo URL and session instructions.' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
} catch {
  Write-Error ('[update-demo] failed: ' + $_.Exception.Message)
  Write-Host ''
  Write-Host 'The script stopped before completing. Fix the reported issue' -ForegroundColor Yellow
  Write-Host 'and rerun. If Docker containers are partially running, use' -ForegroundColor Yellow
  Write-Host 'stop-live-demo.ps1 to clean up, or docker compose up -d --build' -ForegroundColor Yellow
  Write-Host 'to restart the stack manually.' -ForegroundColor Yellow
  exit 1
}
