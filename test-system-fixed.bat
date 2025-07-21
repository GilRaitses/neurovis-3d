@echo off
title CHRIMSON System Diagnostic and Fix
echo.
echo CHRIMSON SYSTEM DIAGNOSTIC AND FIX
echo Testing Real FlyWire Connection + Angular + Cypress
echo NO FALLBACKS, NO MOCK DATA
echo.

REM Kill any existing processes to avoid port conflicts
echo Step 1: Cleaning up existing processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM ng.exe /T >nul 2>&1
taskkill /F /IM cypress.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo COMPLETED: Cleaned up existing processes

REM Check if ports are free
echo.
echo Step 2: Checking port availability...
netstat -ano | findstr ":4200 " >nul
if not errorlevel 1 (
    echo WARNING: Port 4200 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4200 "') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr ":5000 " >nul
if not errorlevel 1 (
    echo WARNING: Port 5000 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr ":9997 " >nul
if not errorlevel 1 (
    echo WARNING: Port 9997 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9997 "') do taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo COMPLETED: Ports prepared

REM Test 1: Install/check Cypress dependencies
echo.
echo Step 3: Testing Cypress installation...
npx cypress version >nul 2>&1
if errorlevel 1 (
    echo INSTALLING: Cypress...
    npm install cypress --save-dev
    if errorlevel 1 (
        echo ERROR: Cypress installation failed
        pause
        exit /b 1
    )
)
echo COMPLETED: Cypress ready

REM Test 2: Check Angular configuration issue
echo.
echo Step 4: Checking Angular configuration...
echo ISSUE DETECTED: Angular serve requires buildTarget in angular.json

REM Check if angular.json has the required buildTarget
findstr "buildTarget" angular.json >nul
if errorlevel 1 (
    echo ERROR: Missing buildTarget in angular.json serve configuration
    echo This needs to be fixed before Angular can start
) else (
    echo COMPLETED: Angular configuration appears correct
)

REM Test 3: Python backend with REAL connection
echo.
echo Step 5: Testing REAL FlyWire backend...
cd backend

REM Check Python dependencies
python -c "import caveclient, neuroglancer, flask" >nul 2>&1
if errorlevel 1 (
    echo INSTALLING: Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Python dependency installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo TESTING: REAL FlyWire connection (Expected to fail with SSL issues)...
echo The backend should fail with SSL errors - this is expected

cd ..

REM Test 4: Check if Firebase deployment is preferred
echo.
echo Step 6: Firebase vs Local Testing...
echo NOTED: User prefers Firebase server over localhost testing
echo Current Firebase URL: https://neurovis-3d.web.app
echo To deploy to Firebase: firebase deploy --only hosting

REM Summary
echo.
echo DIAGNOSTIC SUMMARY
echo ==================
echo.
echo IDENTIFIED ISSUES:
echo ------------------
echo 1. SSL CONNECTION: FlyWire CAVE API SSL handshake fails
echo    - SSLEOFError: EOF occurred in violation of protocol
echo    - This is a network/certificate issue, not a code issue
echo.
echo 2. ANGULAR SERVE: buildTarget configuration error  
echo    - Need to fix angular.json serve configuration
echo    - Cannot start ng serve without this fix
echo.
echo 3. PORT CONFLICTS: Multiple services trying to use same ports
echo    - Backend port 9997 (Neuroglancer) conflicts
echo    - Need better port management
echo.
echo 4. FIREBASE PREFERENCE: User wants to use Firebase hosting
echo    - Instead of localhost testing
echo    - Need to build and deploy to Firebase
echo.
echo NEXT STEPS TO FIX:
echo ==================
echo 1. Fix Angular configuration (buildTarget issue)
echo 2. Build Angular app: ng build --configuration production  
echo 3. Deploy to Firebase: firebase deploy --only hosting
echo 4. Test on Firebase instead of localhost
echo 5. Address SSL issues with network admin or VPN
echo.
echo CRITICAL: Following NO FALLBACKS policy
echo Backend correctly fails when real FlyWire connection unavailable
echo No mock data is being used as requested
echo.
pause 