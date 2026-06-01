# =====================================================================
#  Footy IQ - dev-up.ps1
#  Levanta en orden Mongo, scraper, backend y frontend.
#  Cada proceso abre en su propia ventana de PowerShell para verlos.
#
#  Uso:
#    cd <ruta-del-proyecto>\nuevoFootballHub
#    powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1
#
#  Flags opcionales:
#    -SkipMongo     no comprueba MongoDB
#    -SkipScraper   no arranca el scraper
#    -SkipBackend   no arranca el backend
#    -SkipFrontend  no arranca el frontend
# =====================================================================

param(
  [switch]$SkipMongo,
  [switch]$SkipScraper,
  [switch]$SkipBackend,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Footy IQ - dev-up" -ForegroundColor Cyan
Write-Host "   Root: $Root" -ForegroundColor DarkGray
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Port {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Start-InNewWindow {
  param(
    [string]$Title,
    [string]$WorkingDir,
    [string]$Command
  )
  $full = "Set-Location '$WorkingDir'; `$Host.UI.RawUI.WindowTitle='$Title'; $Command"
  Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $full) | Out-Null
}

function Resolve-PythonCommand {
  $candidates = @(
    "python",
    "py -3.12",
    "py -3.13",
    "py -3"
  )

  foreach ($candidate in $candidates) {
    try {
      $checkCmd = "$candidate -c \"import uvicorn\""
      cmd /c $checkCmd *> $null
      if ($LASTEXITCODE -eq 0) {
        return $candidate
      }
    } catch {
      # Continue probing candidates
    }
  }

  return $null
}

# --- 1. MongoDB -----------------------------------------------------
if (-not $SkipMongo) {
  Write-Host "[1/4] MongoDB (puerto 27017)" -ForegroundColor Yellow
  if (Test-Port 27017) {
    Write-Host "      OK - ya esta escuchando" -ForegroundColor Green
  } else {
    Write-Host "      AVISO - no responde. Arranca Mongo manualmente o con:" -ForegroundColor Red
    Write-Host "        docker run -d -p 27017:27017 --name footyiq-mongodb mongo:7" -ForegroundColor DarkGray
  }
} else {
  Write-Host "[1/4] MongoDB (saltado)" -ForegroundColor DarkGray
}

# --- 2. Scraper -----------------------------------------------------
if (-not $SkipScraper) {
  Write-Host "[2/4] Scraper FastAPI (puerto 8001)" -ForegroundColor Yellow
  if (Test-Port 8001) {
    Write-Host "      Ya esta arriba - no se reinicia" -ForegroundColor Green
  } else {
    $pythonCmd = Resolve-PythonCommand
    if (-not $pythonCmd) {
      Write-Host "      ERROR - no se encontro Python con uvicorn instalado." -ForegroundColor Red
      Write-Host "        Ejecuta: .\instalar-requisitos-footyiq.bat" -ForegroundColor DarkGray
    } else {
      # En Windows (Python 3.13), Playwright puede fallar con --reload
      # al crear subprocess internos. Se arranca sin recarga para estabilidad.
      $cmd = "$pythonCmd -m uvicorn app.main:app --port 8001"
      Start-InNewWindow -Title "footyiq-scraper" -WorkingDir "$Root\scraper" -Command $cmd
      Write-Host "      Lanzado en nueva ventana ($pythonCmd)" -ForegroundColor Green
    }
  }
} else {
  Write-Host "[2/4] Scraper (saltado)" -ForegroundColor DarkGray
}

# --- 3. Backend -----------------------------------------------------
if (-not $SkipBackend) {
  Write-Host "[3/4] Backend Spring Boot (puerto 8080)" -ForegroundColor Yellow
  if (Test-Port 8080) {
    Write-Host "      Ya esta arriba - no se reinicia" -ForegroundColor Green
  } else {
    $envCmd = @(
      "`$env:SPRING_DATA_MONGODB_URI='mongodb://localhost:27017/footyiq'",
      "`$env:SCRAPER_BASE_URL='http://localhost:8001'",
      "`$env:JWT_SECRET='super-secret-key-change-in-production-32chars'",
      "`$env:UPLOADS_PATH='$Root/uploads'",
      "mvn spring-boot:run"
    ) -join "; "
    Start-InNewWindow -Title "footyiq-backend" -WorkingDir "$Root\backend" -Command $envCmd
    Write-Host "      Lanzado en nueva ventana" -ForegroundColor Green
  }
} else {
  Write-Host "[3/4] Backend (saltado)" -ForegroundColor DarkGray
}

# --- 4. Frontend ----------------------------------------------------
if (-not $SkipFrontend) {
  Write-Host "[4/4] Frontend Vite (puerto 5173/5174)" -ForegroundColor Yellow
  if ((Test-Port 5173) -or (Test-Port 5174)) {
    Write-Host "      Ya esta arriba - no se reinicia" -ForegroundColor Green
  } else {
    Start-InNewWindow -Title "footyiq-frontend" -WorkingDir "$Root\frontend" -Command "npm run dev"
    Write-Host "      Lanzado en nueva ventana" -ForegroundColor Green
  }
} else {
  Write-Host "[4/4] Frontend (saltado)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Listo. Comprueba salud en:" -ForegroundColor Cyan
Write-Host "  Backend : http://localhost:8080/api/public/health" -ForegroundColor DarkGray
Write-Host "  Scraper : http://localhost:8001/health" -ForegroundColor DarkGray
Write-Host "  App     : http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
