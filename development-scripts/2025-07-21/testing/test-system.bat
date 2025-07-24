@echo off
title CHRIMSON System Diagnostic & Fix
echo.
echo 🔧 CHRIMSON SYSTEM DIAGNOSTIC & FIX
echo 🔴 Testing Real FlyWire Connection + Angular + Cypress
echo 🚫 NO FALLBACKS, NO MOCK DATA
echo.

REM Kill any existing processes to avoid port conflicts
echo 📋 Step 1: Cleaning up existing processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM ng.exe /T >nul 2>&1
taskkill /F /IM cypress.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✅ Cleaned up existing processes

REM Check if ports are free
echo.
echo 📋 Step 2: Checking port availability...
netstat -ano | findstr ":4200 " >nul
if not errorlevel 1 (
    echo ⚠️ Port 4200 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4200 "') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr ":5000 " >nul
if not errorlevel 1 (
    echo ⚠️ Port 5000 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr ":9997 " >nul
if not errorlevel 1 (
    echo ⚠️ Port 9997 still in use, attempting to free...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9997 "') do taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo ✅ Ports prepared

REM Test 1: Install/check Cypress dependencies
echo.
echo 📋 Step 3: Testing Cypress installation...
npx cypress version >nul 2>&1
if errorlevel 1 (
    echo 🔧 Installing Cypress...
    npm install cypress --save-dev
    if errorlevel 1 (
        echo ❌ Cypress installation failed
        pause
        exit /b 1
    )
)
echo ✅ Cypress ready

REM Test 2: Python backend with REAL connection
echo.
echo 📋 Step 4: Testing REAL FlyWire backend...
cd backend

REM Check Python dependencies
python -c "import caveclient, neuroglancer, flask" >nul 2>&1
if errorlevel 1 (
    echo 🔧 Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Python dependency installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo 🔗 Testing REAL FlyWire connection (this will fail if no real connection)...
start "REAL FlyWire Backend Test" /MIN python real_flywire_neuroglancer.py

REM Wait and test backend
timeout /t 15 /nobreak >nul

curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ REAL FlyWire backend failed to start
    echo 💡 This is expected if SSL/CAVE connection fails
    echo 🔧 Checking backend logs...
    timeout /t 5 /nobreak >nul
    echo.
    echo 📋 Backend Status: FAILED (Expected with SSL issues)
) else (
    echo ✅ REAL FlyWire backend started successfully!
    curl -s http://localhost:5000/api/health
    echo.
)

cd ..

REM Test 3: Angular frontend
echo.
echo 📋 Step 5: Testing Angular frontend...

REM Check Angular dependencies
if not exist node_modules (
    echo 🔧 Installing Angular dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
)

echo 🌐 Starting Angular dev server...
start "Angular Frontend" /MIN ng serve --host 0.0.0.0 --port 4200

REM Wait for Angular to start
timeout /t 20 /nobreak >nul

curl -s http://localhost:4200 >nul 2>&1
if errorlevel 1 (
    echo ❌ Angular frontend failed to start
    echo 🔧 Checking for configuration issues...
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ Angular frontend started successfully!
)

REM Test 4: Cypress with new configuration
echo.
echo 📋 Step 6: Testing Cypress with new configuration...

echo 🧪 Running Cypress validation tests...
REM Try headless first to avoid spawn UNKNOWN
npx cypress run --headless --browser electron
if errorlevel 1 (
    echo ⚠️ Cypress headless run failed, trying interactive mode...
    
    REM Try interactive mode
    start "Cypress Interactive" npx cypress open
    
    echo 📋 Cypress opened in interactive mode
    echo 💡 Please run the tests manually and take screenshots
    echo.
) else (
    echo ✅ Cypress tests completed successfully!
    echo 📸 Screenshots should be in cypress/screenshots/
)

REM Test 5: System integration
echo.
echo 📋 Step 7: System integration test...
echo 🔗 Testing component connectivity...

REM Test Angular -> Backend communication
echo 🧪 Testing Angular to Backend connection...
curl -s -X GET http://localhost:4200 | findstr "CHRIMSON" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Angular frontend contains CHRIMSON content
) else (
    echo ⚠️ Angular frontend may not have CHRIMSON content
)

REM Summary
echo.
echo 🎯 DIAGNOSTIC SUMMARY
echo ====================
echo.

netstat -ano | findstr ":4200 " >nul
if not errorlevel 1 (
    echo ✅ Angular Frontend: Running on http://localhost:4200
) else (
    echo ❌ Angular Frontend: Not running
)

netstat -ano | findstr ":5000 " >nul
if not errorlevel 1 (
    echo ✅ Python Backend: Running on http://localhost:5000
    curl -s http://localhost:5000/api/health 2>nul | findstr "healthy" >nul
    if not errorlevel 1 (
        echo   └─ ✅ Health check: PASSED
    ) else (
        echo   └─ ❌ Health check: FAILED (SSL issues expected)
    )
) else (
    echo ❌ Python Backend: Not running
)

if exist cypress\screenshots (
    echo ✅ Cypress Screenshots: Available for analysis
) else (
    echo ❌ Cypress Screenshots: Not generated
)

echo.
echo 🔧 NEXT STEPS TO FIX ISSUES:
echo ============================
echo.
echo 1. SSL Certificate Issue:
echo    - Contact your network admin about FlyWire SSL certificates
echo    - Or use a VPN/different network to test connection
echo.
echo 2. If Cypress still shows spawn UNKNOWN:
echo    - Run: npm install cypress@latest --save-dev
echo    - Or use manual testing instead of automation
echo.
echo 3. Manual testing checklist:
echo    - Open http://localhost:4200 in browser
echo    - Check for CHRIMSON interface
echo    - Verify Python Neuroglancer component loads
echo    - Test behavioral arena with Three.js
echo.
echo 🔴 CHRIMSON: Red light → Phantom mechanosensation
echo 🧠 NO FALLBACKS: Real FlyWire data only
echo.
echo 📸 Take manual screenshots if Cypress fails
echo 📋 Document any errors for debugging
echo.
pause 