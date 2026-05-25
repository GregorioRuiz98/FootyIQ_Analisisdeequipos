$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Test-Port {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Start-MongoIfNeeded {
  if (Test-Port 27017) {
    Write-Host "MongoDB ya esta escuchando en 27017." -ForegroundColor Green
    return
  }

  if (-not (Test-Command "docker")) {
    Write-Host "MongoDB no esta activo y Docker no esta disponible en PATH." -ForegroundColor Yellow
    Write-Host "Arranca MongoDB manualmente antes de usar la aplicacion." -ForegroundColor Yellow
    return
  }

  $existing = docker ps -a --filter "name=footyiq-mongodb" --format "{{.Names}}" 2>$null
  if ($existing -contains "footyiq-mongodb") {
    Write-Host "Arrancando contenedor existente footyiq-mongodb..." -ForegroundColor Yellow
    docker start footyiq-mongodb | Out-Null
  } else {
    Write-Host "Creando y arrancando MongoDB en Docker..." -ForegroundColor Yellow
    docker run -d -p 27017:27017 --name footyiq-mongodb mongo:7 | Out-Null
  }
}

function Start-ChromeForScraper {
  if (Test-Port 9222) {
    Write-Host "Chrome CDP ya esta disponible en 9222." -ForegroundColor Green
    return
  }

  $launcher = Join-Path $Root "scraper\launch_chrome.ps1"
  if (-not (Test-Path $launcher)) {
    Write-Host "No se encontro $launcher. Se omite apertura de Chrome para Cloudflare." -ForegroundColor Yellow
    return
  }

  Write-Host "Abriendo Chrome para que el scraper pueda superar Cloudflare/FotMob..." -ForegroundColor Yellow
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$launcher`""
  ) | Out-Null
}

function Wait-ForPort {
  param(
    [int[]]$Ports,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    foreach ($port in $Ports) {
      if (Test-Port $port) {
        return $port
      }
    }
    Start-Sleep -Seconds 2
  }

  return $null
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Footy IQ - lanzador completo" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Start-MongoIfNeeded
Start-ChromeForScraper

Write-Host "Levantando scraper, backend y frontend..." -ForegroundColor Yellow
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "run-local.ps1")

Write-Host ""
Write-Host "Esperando a que el frontend este disponible..." -ForegroundColor Cyan
$frontendPort = Wait-ForPort -Ports @(5173, 5174) -TimeoutSeconds 120

if ($frontendPort) {
  $appUrl = "http://localhost:$frontendPort"
  Write-Host "Abriendo Footy IQ en $appUrl" -ForegroundColor Green
  Start-Process $appUrl
} else {
  Write-Host "No se detecto el frontend en 5173/5174 tras la espera." -ForegroundColor Yellow
  Write-Host "Cuando termine de arrancar, abre http://localhost:5173 manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para datos de FotMob, en la ventana de Chrome abierta entra en https://www.fotmob.com/ y completa Cloudflare si aparece." -ForegroundColor DarkGray
Write-Host ""
