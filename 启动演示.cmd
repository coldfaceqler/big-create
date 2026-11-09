@echo off
setlocal
if not exist "%~dp0start-demo.cmd" (
  echo The DYOLL startup script was not found.
  pause
  exit /b 1
)
call "%~dp0start-demo.cmd"
