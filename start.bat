@echo off
title Teamden by shed -- Enterprise System Launcher >nul 2>&1
cd /d "%~dp0"
cls

echo =======================================================================
echo                    TEAMDEN BY SHED (Version 1.0)                    
echo       Team Productivity, Work Management & SaaS Platform            
echo =======================================================================
echo.

echo [1/4] Checking Database (PostgreSQL)...
netstat -ano | findstr :5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Database is offline. Attempting to start PostgreSQL...
    net start postgresql-x64-17 >nul 2>&1
    if errorlevel 1 (
        net start postgresql-x64-16 >nul 2>&1
    )
    if errorlevel 1 (
        if exist "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" (
            "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\17\data" >nul 2>&1
        ) else if exist "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" (
            "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" >nul 2>&1
        )
    )
    ping 127.0.0.1 -n 4 >nul 2>&1
)

netstat -ano | findstr :5432 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] PostgreSQL is active and listening on port 5432.
) else (
    echo [WARNING] PostgreSQL could not be started automatically.
    echo Please make sure the PostgreSQL service or pg_ctl is running.
)
echo.

echo [2/4] Checking Web Server Port (8080)...
netstat -ano | findstr :8080 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | ForEach-Object { Write-Host ('[WARNING] Port 8080 occupied by PID ' + $_.OwningProcess + '. Freeing port...'); Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 1; Write-Host '[OK] Lingering process terminated. Port 8080 is now available.' } else { Write-Host '[OK] Port 8080 is free and available.' }"
) else (
    echo [OK] Port 8080 is free and available.
)
echo.

echo [3/4] Launching Backend Health Monitor...
echo Application will automatically open in Google Chrome once backend server is ready.
echo Login Desk URL: http://localhost:8080/pages/login/login.html
echo.

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "for ($i=0; $i -lt 120; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' 'http://localhost:8080/index.html' } elseif (Test-Path 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' 'http://localhost:8080/index.html' } else { Start-Process 'http://localhost:8080/index.html' }; break } } catch {}; Start-Sleep -Seconds 1 }"

echo [4/4] Starting Spring Boot Server on http://localhost:8080...
echo Website Endpoint: http://localhost:8080/
echo Login Desk      : http://localhost:8080/pages/login/login.html
echo REST API Base   : http://localhost:8080/api
echo.
echo =======================================================================
echo   Server logs will stream below. Press Ctrl+C to stop the application.
echo =======================================================================
echo.

if not defined JAVA_HOME (
    for /d %%J in ("C:\Program Files\Eclipse Adoptium\jdk-21*" "C:\Program Files\Java\jdk-21*" "C:\Program Files\Eclipse Adoptium\jdk-17*" "C:\Program Files\Java\jdk-17*" "C:\Program Files\Eclipse Foundation\jdk-17*") do (
        if exist "%%J\bin\java.exe" set "JAVA_HOME=%%J"
    )
)

if not defined DB_PASSWORD (
    set "DB_PASSWORD=crazy@8"
)
if not defined DB_USERNAME (
    set "DB_USERNAME=postgres"
)

call "%~dp0mvnw.cmd" -f "%~dp0pom.xml" compile spring-boot:run

pause
