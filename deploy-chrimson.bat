@echo off
title CHRIMSON System Deployment
echo.
echo 🚀 DEPLOYING REAL CHRIMSON NEUROGLANCER SYSTEM
echo 🔴 Red Light → Phantom Mechanosensation
echo 🧠 NO FALLBACKS, NO MOCK DATA - REAL FLYWIRE ONLY
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

REM Check Angular CLI
ng version >nul 2>&1
if errorlevel 1 (
    echo ❌ Angular CLI not found! Please install: npm install -g @angular/cli
    pause
    exit /b 1
)

echo ✅ Prerequisites OK

REM Build Angular frontend
echo.
echo 🔨 Building Angular frontend...
call ng build --configuration production
if errorlevel 1 (
    echo ❌ Angular build failed!
    pause
    exit /b 1
)

echo ✅ Angular build complete

REM Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
cd backend
python -c "import caveclient" >nul 2>&1
if errorlevel 1 (
    echo Installing CAVE client...
    pip install caveclient
)

python -c "import neuroglancer" >nul 2>&1
if errorlevel 1 (
    echo Installing Neuroglancer...
    pip install neuroglancer flask flask-cors python-dotenv
)

echo ✅ Python dependencies ready

REM Start REAL FlyWire backend
echo.
echo 🐍 Starting REAL FlyWire backend...
echo 🔗 Connecting to https://cave.flywire.ai...
start "REAL FlyWire Backend" python real_flywire_neuroglancer.py

REM Wait for backend to initialize
echo ⏳ Waiting for backend initialization...
timeout /t 10 /nobreak >nul

REM Test backend connection
echo 🧪 Testing backend connection...
curl -s http://localhost:5000/api/health >nul
if errorlevel 1 (
    echo ⚠️ Backend not responding yet, continuing...
) else (
    echo ✅ Backend responding
)

REM Start Angular dev server
cd ..
echo.
echo 🌐 Starting Angular development server...
start "Angular Frontend" ng serve --host 0.0.0.0 --port 4200

REM Wait for frontend to start
echo ⏳ Waiting for frontend to start...
timeout /t 15 /nobreak >nul

REM Start Cypress for validation
echo.
echo 🧪 Starting Cypress validation tests...
echo 📸 Taking screenshots for system analysis...
start "Cypress Tests" npx cypress open

echo.
echo 🎯 CHRIMSON SYSTEM DEPLOYED!
echo.
echo 🔗 Access Points:
echo   Frontend: http://localhost:4200
echo   Backend API: http://localhost:5000/api/health  
echo   Neuroglancer: http://localhost:9997
echo.
echo 📋 Next Steps:
echo   1. Run Cypress tests to validate features
echo   2. Analyze screenshots in cypress/screenshots/
echo   3. Check browser console for any errors
echo   4. Test REAL FlyWire connectivity
echo.
echo 🔴 CHRIMSON: Red light creates phantom mechanosensation!
echo 🧬 All data comes from REAL FlyWire connectome
echo.
pause 