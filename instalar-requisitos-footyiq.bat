@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ===========================================
echo   Footy IQ - instalacion de requisitos
echo ===========================================
echo.

where winget >nul 2>nul
if errorlevel 1 (
  echo [ERROR] winget no esta disponible en este equipo.
  echo         Instala App Installer desde Microsoft Store y vuelve a ejecutar este script.
  exit /b 1
)

call :ensure_tool "Git" git "Git.Git"
call :ensure_node
call :ensure_java21
call :ensure_tool "Maven" mvn "Apache.Maven"
call :ensure_python
call :ensure_docker

echo.
echo [INFO] Instalando dependencias del proyecto...
echo.

if not exist "uploads" mkdir "uploads"

if exist "frontend\package-lock.json" (
  echo [INFO] Frontend: npm ci
  pushd "frontend"
  call npm ci
  if errorlevel 1 (
    popd
    goto :fail
  )
  popd
) else (
  echo [INFO] Frontend: npm install
  pushd "frontend"
  call npm install
  if errorlevel 1 (
    popd
    goto :fail
  )
  popd
)

echo [INFO] Scraper: instalando paquetes Python
call :resolve_python_cmd
if not defined PYTHON_CMD (
  echo [ERROR] No se encontro Python en PATH despues de la instalacion.
  echo         Cierra y abre una nueva terminal y vuelve a ejecutar este script.
  exit /b 1
)

call %PYTHON_CMD% -m pip install --upgrade pip
if errorlevel 1 goto :fail

call %PYTHON_CMD% -m pip install -r "scraper\requirements.txt"
if errorlevel 1 goto :fail

REM playwright se usa en scraper/app/browser_client.py y no esta fijado en requirements.txt
call %PYTHON_CMD% -m pip install playwright
if errorlevel 1 goto :fail

echo [INFO] Scraper: instalando navegador Chromium de Playwright
call %PYTHON_CMD% -m playwright install chromium
if errorlevel 1 goto :fail

echo [INFO] Backend: resolviendo dependencias Maven
call mvn -q -f "backend\pom.xml" -DskipTests dependency:go-offline
if errorlevel 1 goto :fail

echo.
echo [OK] Requisitos instalados.
echo [INFO] Si se instalaron herramientas nuevas con winget, reinicia la terminal antes de ejecutar abrir-footyiq.bat
echo.
exit /b 0

:ensure_tool
set "TOOL_NAME=%~1"
set "TOOL_CMD=%~2"
set "WINGET_ID=%~3"

where %TOOL_CMD% >nul 2>nul
if not errorlevel 1 (
  echo [OK] %TOOL_NAME% ya esta instalado.
  exit /b 0
)

echo [INFO] Instalando %TOOL_NAME%...
winget install --id %WINGET_ID% -e --source winget --accept-package-agreements --accept-source-agreements --silent
if errorlevel 1 (
  echo [ERROR] No se pudo instalar %TOOL_NAME%.
  exit /b 1
)
echo [OK] %TOOL_NAME% instalado.
exit /b 0

:ensure_node
where node >nul 2>nul
if errorlevel 1 (
  echo [INFO] Instalando Node.js LTS...
  winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements --silent
  if errorlevel 1 (
    echo [ERROR] No se pudo instalar Node.js LTS.
    exit /b 1
  )
  echo [OK] Node.js LTS instalado.
  exit /b 0
)
echo [OK] Node.js ya esta instalado.
exit /b 0

:ensure_java21
set "JAVA_MAJOR="
where java >nul 2>nul
if errorlevel 1 goto :install_java21

for /f "tokens=2 delims=\"" %%a in ('java -version 2^>^&1 ^| findstr /i "version"') do set "JAVA_VER=%%a"
for /f "tokens=1 delims=." %%a in ("!JAVA_VER!") do set "JAVA_MAJOR=%%a"

if "!JAVA_MAJOR!"=="21" (
  echo [OK] Java 21 ya esta instalado.
  exit /b 0
)

echo [WARN] Java detectado: !JAVA_VER! (se recomienda Java 21 para este proyecto).
:install_java21
echo [INFO] Instalando Eclipse Temurin JDK 21...
winget install --id EclipseAdoptium.Temurin.21.JDK -e --source winget --accept-package-agreements --accept-source-agreements --silent
if errorlevel 1 (
  echo [ERROR] No se pudo instalar Java 21.
  exit /b 1
)
echo [OK] Java 21 instalado.
exit /b 0

:ensure_python
call :resolve_python_cmd
if defined PYTHON_CMD (
  for /f "tokens=2" %%a in ('%PYTHON_CMD% --version 2^>^&1') do set "PY_VER=%%a"
  echo [OK] Python detectado: !PY_VER!
  exit /b 0
)

echo [INFO] Instalando Python 3.12...
winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements --silent
if errorlevel 1 (
  echo [ERROR] No se pudo instalar Python 3.12.
  exit /b 1
)
echo [OK] Python 3.12 instalado.
exit /b 0

:ensure_docker
where docker >nul 2>nul
if errorlevel 1 (
  echo [INFO] Docker no detectado. Instalando Docker Desktop...
  winget install --id Docker.DockerDesktop -e --source winget --accept-package-agreements --accept-source-agreements --silent
  if errorlevel 1 (
    echo [WARN] No se pudo instalar Docker Desktop automaticamente.
    echo [WARN] Si usas MongoDB local sin Docker, puedes ignorar este aviso.
    exit /b 0
  )
  echo [OK] Docker Desktop instalado.
  exit /b 0
)

docker compose version >nul 2>nul
if errorlevel 1 (
  echo [WARN] Docker detectado, pero docker compose no esta disponible.
  echo [WARN] Actualiza Docker Desktop si necesitas compose.
  exit /b 0
)

echo [OK] Docker y Docker Compose disponibles.
exit /b 0

:resolve_python_cmd
set "PYTHON_CMD="
where python >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=python"
  exit /b 0
)
where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
  exit /b 0
)
exit /b 0

:fail
echo.
echo [ERROR] La instalacion no pudo completarse. Revisa los mensajes anteriores.
echo.
exit /b 1
