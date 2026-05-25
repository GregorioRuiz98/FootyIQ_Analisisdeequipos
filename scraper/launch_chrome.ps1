# Lanza Chrome real con un perfil dedicado y puerto de debug 9222.
# El scraper se conecta por CDP a esta instancia, asi Cloudflare no detecta automatizacion.
#
# Uso:
#   1) Ejecuta este script.
#   2) En la ventana de Chrome que se abre, navega a https://www.fotmob.com/
#   3) Acepta cookies + pasa el Turnstile (si aparece) una vez.
#   4) Deja la ventana abierta y arranca el scraper.

$ErrorActionPreference = "Stop"

$profileDir = Join-Path $PSScriptRoot ".chrome_profile"
$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) {
    Write-Error "No se encontro chrome.exe. Instala Google Chrome o ajusta la ruta."
    exit 1
}

New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

Write-Host "Lanzando Chrome con debug port 9222..."
Write-Host "Perfil: $profileDir"
Write-Host ""
Write-Host "1) Navega a https://www.fotmob.com/"
Write-Host "2) Acepta cookies + pasa Turnstile si aparece."
Write-Host "3) Deja la ventana abierta y arranca el scraper."

& $chrome `
    --remote-debugging-port=9222 `
    --user-data-dir="$profileDir" `
    --no-first-run `
    --no-default-browser-check `
    "https://www.fotmob.com/"
