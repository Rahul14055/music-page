@echo off
title tyzen01 Portfolio Server
cd /d "%~dp0"

echo ===================================================
echo   Starting tyzen01 Standalone Portfolio Server...
echo ===================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python serve.py 5173 --open
    goto end
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py serve.py 5173 --open
    goto end
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start http://localhost:5173
    npx serve -l 5173 .
    goto end
)

echo [Error] Neither Python nor Node.js was found in your PATH.
echo Please install Python 3 or Node.js to run the local server.
pause

:end

