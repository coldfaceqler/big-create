@echo off
setlocal
title DYOLL - Midterm Demo
cd /d "%~dp0"
if errorlevel 1 goto project_error

where node.exe >nul 2>nul
if errorlevel 1 goto node_error
where npm.cmd >nul 2>nul
if errorlevel 1 goto node_error

if not exist "node_modules\vite\bin\vite.js" (
  echo Installing frontend dependencies...
  call npm.cmd install
  if errorlevel 1 goto install_error
)

echo Starting DYOLL. The browser will open automatically.
echo Keep this window open while using the demo.
echo Press Ctrl+C to stop the local server.
call npm.cmd run dev -- --open
if errorlevel 1 goto start_error
exit /b 0

:project_error
echo Could not open the DYOLL project folder.
goto failed

:node_error
echo Node.js and npm are required. Please install Node.js 24.
goto failed

:install_error
echo Dependency installation failed. Check your network and try again.
goto failed

:start_error
echo DYOLL could not start. Keep this window open and share the error above.

:failed
pause
exit /b 1
