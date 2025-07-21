# SSL Setup Instructions for FlyWire CAVE API on Mac

**To the next agent:** The user will clone this repository on their Mac at home (outside institutional firewall) to resolve SSL connection issues with FlyWire CAVE API.

## Context
- User is currently on institutional network with firewall blocking SSL handshake to `cave.flywire.ai`
- Error: `SSLEOFError: [SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol`
- Backend Python service fails to connect to FlyWire CAVE API due to SSL issues
- User will test from home network where SSL connections should work properly

## Current System Status
- ✅ Angular frontend deployed to Firebase: https://neurovis-3d.web.app
- ✅ Python backend code ready for Cloud Run deployment
- ❌ SSL connection to FlyWire CAVE API fails on institutional network
- ❌ Backend not yet deployed to Cloud Run

## Required Tasks for New Agent

### 1. Test SSL Connection on Mac
```bash
# Test basic SSL connection to FlyWire
curl -v https://cave.flywire.ai

# Test with Python directly
python3 -c "
import requests
import ssl
print('Testing FlyWire CAVE API...')
try:
    response = requests.get('https://cave.flywire.ai', timeout=10)
    print(f'SUCCESS: Status {response.status_code}')
except Exception as e:
    print(f'FAILED: {e}')
"
```

### 2. Fix SSL Configuration if Needed
If SSL still fails on Mac, try these fixes:

```bash
# Update certificates
brew install ca-certificates

# Set Python SSL certificate path
export SSL_CERT_FILE=$(python3 -m certifi)
export REQUESTS_CA_BUNDLE=$(python3 -m certifi)

# Install/update certifi
pip3 install --upgrade certifi requests urllib3
```

### 3. Test Python Backend Locally
```bash
cd backend
pip3 install -r requirements.txt

# Set environment variables
export FLYWIRE_CAVE_TOKEN="b927b9cd93ba0a9b569ab9e32d231dbc"
export NEUROGLANCER_PORT="9997"

# Run backend
python3 real_flywire_neuroglancer.py
```

### 4. Deploy to Google Cloud Run
Once SSL works locally:

```bash
cd backend
# Ensure you're logged into gcloud
gcloud auth login

# Set project
gcloud config set project neurovis-3d

# Deploy using the prepared script
./deploy-to-cloud-run.bat  # (or run commands manually on Mac)
```

### 5. Update Angular Frontend
After deployment, get the Cloud Run URL and update:
- `src/app/services/python-neuroglancer.service.ts`
- Replace `https://chrimson-backend-YOUR_HASH-uc.a.run.app/api` with actual URL

### 6. Test Full System
1. Test Cloud Run backend: `curl https://YOUR-SERVICE-URL/api/health`
2. Redeploy Angular: `ng build --configuration production && firebase deploy --only hosting`
3. Test full integration at: https://neurovis-3d.web.app

## Files to Focus On
- `backend/real_flywire_neuroglancer.py` - Main backend service (cleaned up)
- `backend/Dockerfile` - Container configuration
- `backend/cloudbuild.yaml` - Google Cloud Build config
- `backend/deploy-to-cloud-run.bat` - Deployment script
- `src/app/services/python-neuroglancer.service.ts` - Frontend service

## Expected Outcome
- Backend successfully connects to FlyWire CAVE API
- Real neural circuit data loads (not mock data)
- Neuroglancer visualization displays actual FlyWire meshes
- CHRIMSON red light simulation works with real data

## Troubleshooting Tips
- If SSL still fails, try different networks (mobile hotspot, etc.)
- Check FlyWire CAVE API token validity
- Verify Google Cloud billing is enabled
- Test individual components (Neuroglancer, CAVE client) separately

The user has been very clear about not wanting any fallback/mock data - the system should fail gracefully if real FlyWire data cannot be accessed. 