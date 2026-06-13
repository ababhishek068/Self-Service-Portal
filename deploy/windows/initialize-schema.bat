@echo off
setlocal

for %%I in ("%~dp0..\..") do set "PORTAL_ROOT=%%~fI"
set "DB_ROOT=%PORTAL_ROOT%\db"

where mysql >nul 2>&1
if errorlevel 1 (
  echo ERROR: mysql.exe was not found in PATH.
  echo Add the MySQL Server bin directory to PATH and retry.
  pause
  exit /b 1
)

echo Applying the initial portal schema.
echo Enter the MySQL ssp user password when prompted.
mysql -u ssp -p ssp_portal < "%DB_ROOT%\prisma\migrations\20260606000000_init_auth_requests_attendance\migration.sql"
if errorlevel 1 (
  echo ERROR: Initial schema migration failed.
  pause
  exit /b 1
)

echo Applying the manager index migration.
mysql -u ssp -p ssp_portal < "%DB_ROOT%\prisma\migrations\20260609000000_add_user_manager_index\migration.sql"
if errorlevel 1 (
  echo ERROR: Manager index migration failed.
  pause
  exit /b 1
)

echo Database schema initialized successfully.
