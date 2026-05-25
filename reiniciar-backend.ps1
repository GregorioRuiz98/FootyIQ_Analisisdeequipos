$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$BackendPort = 8080

function Get-ListenerPids {
  param([int]$Port)
  @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Footy IQ - reinicio de backend" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BackendDir)) {
  throw "No se encontro la carpeta backend en: $BackendDir"
}

$pids = Get-ListenerPids -Port $BackendPort
if ($pids.Count -gt 0) {
  Write-Host "Cerrando procesos en puerto ${BackendPort}: $($pids -join ', ')" -ForegroundColor Yellow
  foreach ($procId in $pids) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "  - PID ${procId} detenido" -ForegroundColor Green
    } catch {
      Write-Host "  - No se pudo detener PID ${procId}: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
} else {
  Write-Host "No habia procesos escuchando en $BackendPort." -ForegroundColor DarkGray
}

Start-Sleep -Seconds 2

$envCmd = @(
  "`$env:SPRING_DATA_MONGODB_URI='mongodb://localhost:27017/footyiq'",
  "`$env:SCRAPER_BASE_URL='http://localhost:8001'",
  "`$env:JWT_SECRET='super-secret-key-change-in-production-32chars'",
  "`$env:UPLOADS_PATH='$Root/uploads'",
  "mvn spring-boot:run"
) -join "; "

Write-Host "Arrancando backend en nueva ventana..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$BackendDir'; `$Host.UI.RawUI.WindowTitle='footyiq-backend'; $envCmd"
) | Out-Null

Write-Host "Listo. Comprueba en: http://localhost:8080/api/public/health" -ForegroundColor Green
Write-Host ""
