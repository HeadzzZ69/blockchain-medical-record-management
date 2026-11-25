@echo off
setlocal enabledelayedexpansion

title MedVault - Master Project Stopper

:: Set root directory with trailing backslash
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ===============================================================================
echo     MEDVAULT: BLOCKCHAIN ELECTRONIC MEDICAL RECORD ACCESS MANAGEMENT
echo                      PROJECT SHUTDOWN UTILITY
echo ===============================================================================
echo [INFO] Stopping all MedVault project services safely...
echo.

node "%ROOT_DIR%scripts\launcher-utils.js" kill-ports 5173 5000 8545

echo.
echo ===============================================================================
echo  [OK] ALL PROJECT SERVICES HAVE BEEN TERMINATED:
echo   - Frontend Server (Port 5173): Stopped
echo   - Backend API Server (Port 5000): Stopped
echo   - Hardhat Blockchain Node (Port 8545): Stopped
echo.
echo  Unrelated processes on your computer were left untouched.
echo  To restart the project at any time, run: START-ALL.bat
echo ===============================================================================
echo.
echo Press any key to exit...
pause >nul
exit /b 0
