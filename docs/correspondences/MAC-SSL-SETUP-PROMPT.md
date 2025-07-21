# Prompt for New Agent: Mac SSL Setup for FlyWire CAVE API

## Context
I'm working on a CHRIMSON neuroglancer system that connects to the FlyWire CAVE API. The SSL connection fails when running from my institutional network (Windows), but I want to test it from my Mac at home (outside the institutional firewall) to isolate the network issue.

## Current SSL Error
```
SSLEOFError: [SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol
HTTPSConnectionPool(host='cave.flywire.ai', port=443): Max retries exceeded
```

## What I Need You To Do

### 1. Help me clone and set up the project on Mac
- Clone from: https://github.com/GilRaitses/neurovis-3d
- Set up Python environment for the backend
- Install dependencies from `backend/requirements.txt`
- Configure environment variables for FlyWire API

### 2. Test FlyWire CAVE API connection from Mac
- Test direct connection to `https://cave.flywire.ai`
- Verify SSL certificate chain
- Try the CAVE client with my token outside institutional firewall
- Compare SSL handshake behavior vs institutional network

### 3. If connection works on Mac, help me:
- Document the working SSL configuration
- Create a production-ready SSL setup
- Deploy the working backend to Google Cloud Run
- Update the Angular frontend to use the cloud backend URL

### 4. If connection still fails, help me:
- Diagnose the SSL certificate issue
- Find alternative FlyWire connection methods
- Set up proper SSL certificates for production
- Contact FlyWire team if needed

## Technical Details

### Backend Files
- Main backend: `backend/real_flywire_neuroglancer.py` (renamed from old files)
- Docker setup: `backend/Dockerfile`
- Cloud deployment: `backend/cloudbuild.yaml`
- Dependencies: `backend/requirements.txt`

### Environment Variables Needed
```
FLYWIRE_CAVE_TOKEN=b927b9cd93ba0a9b569ab9e32d231dbc
DATASET=flywire_fafb_production  
NEUROGLANCER_PORT=9997
```

### Key Points
- The system is designed with NO fallbacks to mock data
- It must connect to real FlyWire CAVE API or fail explicitly
- We're using CHRIMSON optogenetics for mechanosensory research
- Angular frontend is already deployed to Firebase: https://neurovis-3d.web.app

## Expected Outcome
Either:
1. **Success**: Working FlyWire connection from Mac → Deploy to Cloud Run → Full system functional
2. **Diagnostic**: Clear understanding of SSL issue → Plan for resolution

## Repository Structure
```
neurovis-3d/
├── backend/                    # Python Flask + Neuroglancer
│   ├── real_flywire_neuroglancer.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── cloudbuild.yaml
├── src/                        # Angular frontend (already deployed)
└── docs/                       # Documentation
```

## Test Commands
```bash
# Clone repo
git clone https://github.com/GilRaitses/neurovis-3d
cd neurovis-3d/backend

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test FlyWire connection
python -c "
from caveclient import CAVEclient
client = CAVEclient('flywire_fafb_production', server_address='https://cave.flywire.ai')
print('Testing FlyWire connection...')
info = client.info.get_datastack_info()
print(f'Success: {info[\"description\"]}')
"

# Run backend
python real_flywire_neuroglancer.py
```

## Success Criteria
- [ ] FlyWire CAVE API connection successful from Mac
- [ ] Backend starts without SSL errors
- [ ] Neuroglancer viewer initializes
- [ ] Health endpoint returns success
- [ ] Cloud Run deployment works
- [ ] Angular frontend connects to cloud backend

Please help me get this working outside the institutional firewall! 