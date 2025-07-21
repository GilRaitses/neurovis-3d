@echo off
title Deploy CHRIMSON Backend to Google Cloud Run
echo.
echo DEPLOYING CHRIMSON BACKEND TO GOOGLE CLOUD RUN
echo NO FALLBACKS, NO MOCK DATA - REAL FLYWIRE ONLY
echo.

REM Check if gcloud is installed
gcloud version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Google Cloud CLI not found
    echo Please install from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if errorlevel 1 (
    echo AUTHENTICATING: Please log in to Google Cloud...
    gcloud auth login
    if errorlevel 1 (
        echo ERROR: Authentication failed
        pause
        exit /b 1
    )
)

REM Set project ID (replace with your actual project ID)
set PROJECT_ID=neurovis-3d
echo PROJECT: %PROJECT_ID%

REM Set the project
gcloud config set project %PROJECT_ID%
if errorlevel 1 (
    echo ERROR: Failed to set project
    pause
    exit /b 1
)

REM Enable required APIs
echo.
echo ENABLING: Required Google Cloud APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM Build and deploy using Cloud Build
echo.
echo BUILDING: Container image and deploying to Cloud Run...
echo This will take 5-10 minutes...

gcloud builds submit --config cloudbuild.yaml .
if errorlevel 1 (
    echo ERROR: Cloud Build deployment failed
    echo.
    echo TROUBLESHOOTING:
    echo 1. Check that your project ID is correct: %PROJECT_ID%
    echo 2. Verify billing is enabled for the project
    echo 3. Check that required APIs are enabled
    echo 4. Ensure Docker builds locally first
    pause
    exit /b 1
)

echo.
echo SUCCESS: CHRIMSON Backend deployed to Cloud Run!
echo.

REM Get the service URL
echo GETTING: Service URL...
for /f "delims=" %%i in ('gcloud run services describe chrimson-backend --region=us-central1 --format="value(status.url)"') do set SERVICE_URL=%%i

echo.
echo DEPLOYMENT COMPLETE!
echo ====================
echo Service URL: %SERVICE_URL%
echo Health Check: %SERVICE_URL%/api/health
echo.
echo NEXT STEPS:
echo 1. Test health endpoint: curl %SERVICE_URL%/api/health
echo 2. Update Angular frontend to use this URL
echo 3. Verify CORS allows Firebase domain
echo 4. Test CHRIMSON circuits: %SERVICE_URL%/api/circuits/search
echo.
echo IMPORTANT: The SSL connection to FlyWire may still fail
echo This is a network/certificate issue, not a deployment issue
echo The backend will return appropriate error messages
echo.
pause 