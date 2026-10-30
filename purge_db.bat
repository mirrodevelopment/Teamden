@echo off
title Teamden by shed -- Database Purge Utility >nul 2>&1
cd /d "%~dp0"
cls

echo =======================================================================
echo                    TEAMDEN BY SHED (Version 1.0)                    
echo              Database Purge and Truncation Utility                   
echo =======================================================================
echo.

REM ---------------------------------------------------------------------------
REM 1. Configuration and Credential Resolution (Defaults from application.yaml)
REM ---------------------------------------------------------------------------
if not defined DB_HOST (
    set "DB_HOST=localhost"
)
if not defined DB_PORT (
    set "DB_PORT=5432"
)
if not defined DB_NAME (
    set "DB_NAME=teamden"
)
if not defined DB_USERNAME (
    set "DB_USERNAME=postgres"
)
if not defined DB_PASSWORD (
    set "DB_PASSWORD=crazy@8"
)

set "PGPASSWORD=%DB_PASSWORD%"

REM Check for non-interactive / force flag
set "FORCE_MODE=0"
if /i "%~1"=="--force" set "FORCE_MODE=1"
if /i "%~1"=="-f" set "FORCE_MODE=1"
if /i "%~1"=="/force" set "FORCE_MODE=1"
if /i "%~1"=="/f" set "FORCE_MODE=1"

REM ---------------------------------------------------------------------------
REM 2. Locate psql.exe Binary
REM ---------------------------------------------------------------------------
set "PSQL_CMD="

REM Check PATH first
where psql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PSQL_CMD=psql"
    goto :PSQL_FOUND
)

REM Check standard PostgreSQL installation directories
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files\PostgreSQL\17\bin\psql.exe"
    goto :PSQL_FOUND
)
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files\PostgreSQL\16\bin\psql.exe"
    goto :PSQL_FOUND
)
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files\PostgreSQL\15\bin\psql.exe"
    goto :PSQL_FOUND
)
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files\PostgreSQL\14\bin\psql.exe"
    goto :PSQL_FOUND
)
if exist "C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe"
    goto :PSQL_FOUND
)
if exist "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe" (
    set "PSQL_CMD=C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
    goto :PSQL_FOUND
)

:PSQL_FOUND
if not defined PSQL_CMD (
    echo [ERROR] PostgreSQL client psql.exe could not be found.
    echo Please ensure PostgreSQL is installed or add psql.exe to your PATH.
    echo.
    goto :END
)

echo [OK] PostgreSQL client located: "%PSQL_CMD%"
echo [OK] Target Database: %DB_NAME% on %DB_HOST%:%DB_PORT% (User: %DB_USERNAME%)
echo.

REM ---------------------------------------------------------------------------
REM 3. Connectivity Verification
REM ---------------------------------------------------------------------------
echo [1/3] Verifying database connectivity...
"%PSQL_CMD%" -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not connect to database '%DB_NAME%' on %DB_HOST%:%DB_PORT%.
    echo Please make sure the PostgreSQL service is active and credentials are valid.
    echo.
    goto :END
)
echo [OK] Database connection established.
echo.

REM ---------------------------------------------------------------------------
REM 4. User Confirmation Safety Gate
REM ---------------------------------------------------------------------------
if "%FORCE_MODE%"=="0" (
    echo -----------------------------------------------------------------------
    echo  WARNING: You are about to PERMANENTLY ERASE ALL DATA from:
    echo  Database: %DB_NAME%
    echo  All user tables [tasks, projects, users, organizations, etc.] will be
    echo  emptied. All table structures and migration history will be preserved.
    echo -----------------------------------------------------------------------
    echo.
    set /p "CONFIRM=Type Y to confirm and purge all data (or press Enter to cancel): "
    if /i not "%CONFIRM%"=="Y" (
        echo.
        echo [ABORTED] Database purge cancelled by user. No data was modified.
        echo.
        goto :END
    )
    echo.
) else (
    echo [INFO] Force flag detected. Proceeding without interactive prompt...
    echo.
)

REM ---------------------------------------------------------------------------
REM 5. Execute Dynamic Truncation
REM ---------------------------------------------------------------------------
echo [2/3] Purging data from all application tables...

"%PSQL_CMD%" -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "TRUNCATE TABLE activity_events, attendance_records, tasks, projects, organization_memberships, users, organizations RESTART IDENTITY CASCADE;"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] An error occurred while executing table truncation.
    echo.
    goto :END
)
echo [OK] All application tables successfully truncated.
echo.

REM ---------------------------------------------------------------------------
REM 6. Post-Purge Verification (Check remaining rows in all tables)
REM ---------------------------------------------------------------------------
echo [3/3] Verifying remaining table rows...
echo.

"%PSQL_CMD%" -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT 'activity_events' AS table_name, count(*) AS row_count FROM activity_events UNION ALL SELECT 'attendance_records', count(*) FROM attendance_records UNION ALL SELECT 'organization_memberships', count(*) FROM organization_memberships UNION ALL SELECT 'organizations', count(*) FROM organizations UNION ALL SELECT 'projects', count(*) FROM projects UNION ALL SELECT 'tasks', count(*) FROM tasks UNION ALL SELECT 'users', count(*) FROM users UNION ALL SELECT 'flyway_schema_history (preserved)', count(*) FROM flyway_schema_history;"

echo.
echo =======================================================================
echo [SUCCESS] Database purge completed successfully.
echo All user tables are now empty (0 rows) and ready for fresh data.
echo Table structures, constraints, and Flyway migration history remain intact.
echo =======================================================================
echo.

:END
if "%FORCE_MODE%"=="0" (
    pause
)
