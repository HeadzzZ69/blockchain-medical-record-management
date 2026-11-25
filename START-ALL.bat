@echo off
setlocal enabledelayedexpansion

title MedVault - Master Project Starter

:: Set root directory with trailing backslash
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ===============================================================================
echo     MEDVAULT: BLOCKCHAIN ELECTRONIC MEDICAL RECORD ACCESS MANAGEMENT
echo                      AUTOMATED ONE-CLICK STARTER
echo ===============================================================================
echo [INFO] Starting pre-flight system checks...
echo.

:: -----------------------------------------------------------------------------
:: 1. PRE-FLIGHT CHECKS
:: -----------------------------------------------------------------------------

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    goto :FAIL
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js detected: %NODE_VER%

:: Check npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not found in system PATH.
    goto :FAIL
)
echo [OK] npm package manager detected.

:: Check project folders
if not exist "%ROOT_DIR%blockchain\" (
    echo [ERROR] Directory "%ROOT_DIR%blockchain" not found.
    goto :FAIL
)
if not exist "%ROOT_DIR%backend\" (
    echo [ERROR] Directory "%ROOT_DIR%backend" not found.
    goto :FAIL
)
if not exist "%ROOT_DIR%frontend\" (
    echo [ERROR] Directory "%ROOT_DIR%frontend" not found.
    goto :FAIL
)
echo [OK] All core project directories found: blockchain, backend, frontend.

:: Check package.json files
if not exist "%ROOT_DIR%blockchain\package.json" (
    echo [ERROR] "%ROOT_DIR%blockchain\package.json" is missing.
    goto :FAIL
)
if not exist "%ROOT_DIR%backend\package.json" (
    echo [ERROR] "%ROOT_DIR%backend\package.json" is missing.
    goto :FAIL
)
if not exist "%ROOT_DIR%frontend\package.json" (
    echo [ERROR] "%ROOT_DIR%frontend\package.json" is missing.
    goto :FAIL
)
echo [OK] All module package.json configuration files present.

:: Check node_modules dependencies
if not exist "%ROOT_DIR%blockchain\node_modules\" (
    echo [WARN] blockchain\node_modules is missing. Installing dependencies...
    cd /d "%ROOT_DIR%blockchain" && call npm install
    cd /d "%ROOT_DIR%"
)
if not exist "%ROOT_DIR%backend\node_modules\" (
    echo [WARN] backend\node_modules is missing. Installing dependencies...
    cd /d "%ROOT_DIR%backend" && call npm install
    cd /d "%ROOT_DIR%"
)
if not exist "%ROOT_DIR%frontend\node_modules\" (
    echo [WARN] frontend\node_modules is missing. Installing dependencies...
    cd /d "%ROOT_DIR%frontend" && call npm install
    cd /d "%ROOT_DIR%"
)
echo [OK] Project dependencies are installed and verified.

:: Check backend .env
if not exist "%ROOT_DIR%backend\.env" (
    if exist "%ROOT_DIR%backend\.env.example" (
        echo [WARN] backend\.env not found. Creating from .env.example...
        copy "%ROOT_DIR%backend\.env.example" "%ROOT_DIR%backend\.env" >nul
        echo [OK] Created backend\.env with default configuration.
    ) else (
        echo [ERROR] backend\.env is missing and .env.example was not found.
        goto :FAIL
    )
) else (
    echo [OK] Backend environment configuration file detected.
)

echo.
echo ===============================================================================
echo  [STEP 1/5] CHECKING DATABASE STATUS [MONGODB]
echo ===============================================================================
node "%ROOT_DIR%scripts\launcher-utils.js" check-mongo

echo.
echo ===============================================================================
echo  [STEP 2/5] STARTING LOCAL HARDHAT BLOCKCHAIN NODE
echo ===============================================================================

:: Check if port 8545 is already running
node "%ROOT_DIR%scripts\launcher-utils.js" is-port-open 8545 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] Hardhat local blockchain node is ALREADY running on port 8545.
    echo [INFO] Skipping duplicate blockchain process startup.
) else (
    echo [INFO] Launching new Hardhat blockchain node in a dedicated terminal...
    start "MedVault - Blockchain Node" cmd /k "title MedVault - Blockchain Node && cd /d "%ROOT_DIR%blockchain" && node scripts/run-node.js"
    
    echo [INFO] Waiting for blockchain JSON-RPC at http://127.0.0.1:8545 to become responsive...
    node "%ROOT_DIR%scripts\launcher-utils.js" wait-url http://127.0.0.1:8545 30
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Blockchain failed to respond within 30 seconds.
        echo Please inspect the MedVault - Blockchain Node window for error details.
        goto :FAIL
    )
    echo [OK] Hardhat local blockchain node is ready on Chain ID 31337.
)

echo.
echo ===============================================================================
echo  [STEP 3/5] COMPILING AND DEPLOYING SMART CONTRACT [MedicalRecordAccess.sol]
echo ===============================================================================
echo [INFO] Compiling Solidity smart contracts with Hardhat...
cd /d "%ROOT_DIR%blockchain"
call npx hardhat compile
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Smart contract compilation failed.
    goto :FAIL
)

echo [INFO] Deploying MedicalRecordAccess contract to local Hardhat network...
call npx hardhat run scripts/deploy.js --network localhost
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Smart contract deployment to localhost network failed.
    echo Please make sure the Hardhat blockchain node terminal is active on port 8545.
    goto :FAIL
)
cd /d "%ROOT_DIR%"

for /f "tokens=*" %%a in ('node "%ROOT_DIR%scripts\launcher-utils.js" get-contract-address') do set "CONTRACT_ADDR=%%a"
echo [OK] MedicalRecordAccess deployed successfully.
echo [OK] Active Contract Address: !CONTRACT_ADDR!
echo [OK] ABI and address synchronized to frontend and backend config files.

echo.
echo ===============================================================================
echo  [STEP 4/5] STARTING EXPRESS BACKEND SERVER [Port 5000]
echo ===============================================================================

node "%ROOT_DIR%scripts\launcher-utils.js" is-port-open 5000 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] Backend is ALREADY running on port 5000.
) else (
    echo [INFO] Launching Express backend server in a dedicated terminal...
    start "MedVault - Backend Server" cmd /k "title MedVault - Backend Server && cd /d "%ROOT_DIR%backend" && node src/server.js"
    
    echo [INFO] Waiting for backend API health check at http://localhost:5000/api/health...
    node "%ROOT_DIR%scripts\launcher-utils.js" wait-url http://localhost:5000/api/health 30
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Backend failed to start or health check timed out.
        echo Please inspect the MedVault - Backend Server window for error details.
        goto :FAIL
    )
    echo [OK] Backend server is active, connected to database, and listening on port 5000.
)

echo.
echo ===============================================================================
echo  [STEP 5/5] STARTING VITE REACT FRONTEND [Port 5173]
echo ===============================================================================

node "%ROOT_DIR%scripts\launcher-utils.js" is-port-open 5173 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] Frontend development server is ALREADY running on port 5173.
) else (
    echo [INFO] Launching Vite frontend server in a dedicated terminal...
    start "MedVault - Frontend Server" cmd /k "title MedVault - Frontend Server && cd /d "%ROOT_DIR%frontend" && npm run dev"
    
    echo [INFO] Waiting for frontend server at http://localhost:5173...
    node "%ROOT_DIR%scripts\launcher-utils.js" wait-url http://localhost:5173 30
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Frontend server failed to start within timeout.
        echo Please inspect the MedVault - Frontend Server window for details.
        goto :FAIL
    )
    echo [OK] Frontend development server is ready on http://localhost:5173.
)

echo.
echo ===============================================================================
echo                     ALL MEDVAULT SERVICES ARE ACTIVE!
echo ===============================================================================
echo  - Frontend Web UI:       http://localhost:5173
echo  - Backend REST API:      http://localhost:5000/api
echo  - Backend Health Check:  http://localhost:5000/api/health
echo  - Hardhat Local Node:    http://127.0.0.1:8545 [Chain ID: 31337]
echo  - Deployed Contract:     !CONTRACT_ADDR!
echo.
echo  Opening MedVault in your default browser...
start http://localhost:5173

echo.
echo ===============================================================================
echo  TIPS FOR COLLEGE EVALUATION / DEMONSTRATION:
echo   1. Make sure your browser has the MetaMask extension installed.
echo   2. Network settings: RPC = http://127.0.0.1:8545, Chain ID = 31337.
echo   3. Pre-funded Demo Accounts:
echo      - Admin:   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo      - Doctor:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
echo      - Hospital:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
echo      - Patient: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
echo.
echo   To safely shut down all services, double-click: STOP-ALL.bat
echo ===============================================================================
echo.
echo Press any key to close this launcher window [background services will remain active]...
pause >nul
exit /b 0

:FAIL
echo.
echo ===============================================================================
echo  [FAILED] STARTUP ABORTED DUE TO AN ERROR.
echo  Please review the messages above to resolve the issue before restarting.
echo ===============================================================================
echo.
pause
exit /b 1
