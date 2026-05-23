@echo off
setlocal
title Abomination Playhouse
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed or not on PATH.
  echo  Install it from https://nodejs.org/ and try again.
  echo.
  pause
  exit /b 1
)

node server.js
set EXITCODE=%errorlevel%
echo.
echo  Server stopped (exit code %EXITCODE%).
pause
exit /b %EXITCODE%
