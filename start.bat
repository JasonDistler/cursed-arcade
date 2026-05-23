@echo off
setlocal enableextensions
chcp 65001 >nul
title Cursed Arcade
cd /d "%~dp0"

echo.
echo  ============================================
echo    Cursed Arcade  --  local Node server
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js is not installed or not on PATH.
  echo.
  echo  Install Node.js from https://nodejs.org/ and try again.
  echo  Restart this window after installing so PATH refreshes.
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0server.js" (
  echo  [ERROR] server.js not found next to start.bat.
  echo  Make sure you double-clicked start.bat from inside the
  echo  cursed-arcade folder.
  echo.
  pause
  exit /b 1
)

node "%~dp0server.js"
set EXITCODE=%errorlevel%

echo.
if %EXITCODE% NEQ 0 (
  echo  Server stopped with error code %EXITCODE%.
) else (
  echo  Server stopped cleanly.
)
echo.
pause
exit /b %EXITCODE%
