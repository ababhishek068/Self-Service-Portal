@echo off
setlocal EnableDelayedExpansion

for %%I in ("%~dp0..\..\..") do set "SUITE_ROOT=%%~fI"
set "PORTAL_ROOT=%SUITE_ROOT%\SelfServicePortal"
set "BC_ROOT=%SUITE_ROOT%\SelfServiceBackend"

if not exist "!PORTAL_ROOT!\server\.env" (
  echo ERROR: SelfServicePortal\server\.env is missing.
  pause
  exit /b 1
)

if not exist "!PORTAL_ROOT!\db\.env" (
  echo ERROR: SelfServicePortal\db\.env is missing.
  pause
  exit /b 1
)

if not exist "!BC_ROOT!\.env" (
  echo ERROR: SelfServiceBackend\.env is missing.
  pause
  exit /b 1
)

if not exist "!PORTAL_ROOT!\server\dist\index.js" (
  echo ERROR: Application server build is missing.
  pause
  exit /b 1
)

if not exist "!BC_ROOT!\dist\server.js" (
  echo ERROR: BC backend build is missing.
  pause
  exit /b 1
)

if not exist "!BC_ROOT!\public\index.html" (
  echo ERROR: React production build is missing.
  pause
  exit /b 1
)

if not exist "!PORTAL_ROOT!\server\node_modules\@ssp\db\src\index.js" (
  echo Repairing the server to database package link...
  if not exist "!PORTAL_ROOT!\server\node_modules\@ssp" mkdir "!PORTAL_ROOT!\server\node_modules\@ssp"
  if exist "!PORTAL_ROOT!\server\node_modules\@ssp\db" rmdir /s /q "!PORTAL_ROOT!\server\node_modules\@ssp\db"
  mklink /J "!PORTAL_ROOT!\server\node_modules\@ssp\db" "!PORTAL_ROOT!\db"
  if errorlevel 1 (
    echo ERROR: Could not create the server to database package junction.
    pause
    exit /b 1
  )
)

if not exist "!PORTAL_ROOT!\server\logs" mkdir "!PORTAL_ROOT!\server\logs"
if not exist "!BC_ROOT!\logs" mkdir "!BC_ROOT!\logs"

set NODE_ENV=production

echo Starting Application User API on port 4001...
start "Self Service Application API" /D "!PORTAL_ROOT!\server" cmd /c "set NODE_ENV=production&& node dist\index.js >> logs\application-api.log 2>&1"

echo Starting BC API and React portal on port 4000...
start "Self Service BC API" /D "!BC_ROOT!" cmd /c "set NODE_ENV=production&& node dist\server.js >> logs\bc-api.log 2>&1"

echo.
echo Services started.
echo Portal: http://HOST-IP:4000
echo Application API: http://HOST-IP:4001/api/health
echo BC API: http://HOST-IP:4000/api/health
