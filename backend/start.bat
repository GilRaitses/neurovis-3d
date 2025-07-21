@echo off
echo 🚀 Starting CHRIMSON Neuroglancer Backend...
echo 🔴 Red Light → Phantom Mechanosensation
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if requirements are installed
python -c "import neuroglancer" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo ✅ Dependencies OK
echo 🐍 Starting Python backend on localhost:5000...
echo 🎯 Neuroglancer will start on localhost:9999...
echo.
echo Press Ctrl+C to stop the backend
echo.

python chrimson_neuroglancer.py 