# Secret Management Strategy - NeuroVis3D

## 🔐 Security Overview

### Current Environment Variables (Public - Safe in YAML)
```yaml
# These are safe to keep in apphosting.yaml (no secrets)
env:
  - variable: NODE_ENV
    value: production                    # ✅ Safe - build configuration
  - variable: GCP_REGION  
    value: us-central1                   # ✅ Safe - public region
  - variable: FLYWIRE_API_BASE_URL
    value: https://codex.flywire.ai/api/v1  # ✅ Safe - public endpoint
  - variable: ALLOWED_ORIGINS
    value: "https://neurovis-3d-api--neurovis-3d.us-central1.hosted.app"  # ✅ Safe - public URLs
```

### Future Secrets (Use Secret Manager)
```yaml
# These MUST use Secret Manager when we add them
env:
  - variable: FLYWIRE_API_KEY
    secret: projects/neurovis-3d/secrets/flywire-api-key/versions/latest
  - variable: DATABASE_PASSWORD  
    secret: projects/neurovis-3d/secrets/db-password/versions/latest
  - variable: JWT_SECRET
    secret: projects/neurovis-3d/secrets/jwt-secret/versions/latest
```

---

## 🛠️ Secret Manager Setup

### 1. Enable Secret Manager API
```bash
gcloud services enable secretmanager.googleapis.com --project=neurovis-3d
```

### 2. Create Secrets (When Needed)
```bash
# FlyWire API Key (when we get one)
echo "your-actual-api-key" | gcloud secrets create flywire-api-key \
  --data-file=- \
  --project=neurovis-3d

# Database credentials (when we set up Firestore auth)
echo "your-db-connection-string" | gcloud secrets create db-connection \
  --data-file=- \
  --project=neurovis-3d

# JWT signing secret (for user authentication)
openssl rand -base64 32 | gcloud secrets create jwt-secret \
  --data-file=- \
  --project=neurovis-3d
```

### 3. Grant Access to Firebase App Hosting
```bash
# Get the service account used by Firebase App Hosting
PROJECT_NUMBER="359448340087"
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secret access
gcloud secrets add-iam-policy-binding flywire-api-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=neurovis-3d
```

---

## 📋 Current Security Status ✅ GOOD

### Why Our Current Setup Is Secure
1. **No API Keys Yet**: We're using public FlyWire endpoints (no authentication required)
2. **No Database Credentials**: Using Firestore with default IAM (no passwords)
3. **No User Authentication**: Health check app doesn't need JWT secrets
4. **Public Configuration Only**: All current env vars are safe to be public

### When We'll Need Secret Manager
- **Phase 2**: FlyWire API authentication (if required)
- **Phase 3**: User authentication system (JWT secrets)
- **Phase 4**: External database connections (credentials)

---

## 🔄 Migration Strategy

### Current apphosting.yaml (Keep As-Is)
```yaml
env:
  # Public configuration - safe in repository
  - variable: NODE_ENV
    value: production
  - variable: FIREBASE_PROJECT_ID
    value: neurovis-3d
  - variable: FLYWIRE_API_BASE_URL
    value: https://codex.flywire.ai/api/v1
```

### Future apphosting.yaml (When Secrets Added)
```yaml
env:
  # Public configuration
  - variable: NODE_ENV
    value: production
  
  # Private secrets from Secret Manager  
  - variable: FLYWIRE_API_KEY
    secret: projects/neurovis-3d/secrets/flywire-api-key/versions/latest
    
  - variable: DATABASE_URL
    secret: projects/neurovis-3d/secrets/database-url/versions/latest
```

---

## 🎯 Security Best Practices

### ✅ Current Implementation
- Public configuration in `apphosting.yaml`
- No secrets exposed in GitHub repository
- Firebase IAM handles service authentication
- CORS properly configured for domain restrictions

### 🔄 Future Security Enhancements
1. **Secret Rotation**: Automatic rotation of API keys
2. **Audit Logging**: Monitor secret access
3. **Least Privilege**: Minimal IAM permissions
4. **Environment Separation**: Dev/staging/prod secret isolation

---

## 📊 Security Assessment

| Component | Current Status | Security Level |
|-----------|---------------|----------------|
| **Environment Config** | ✅ Public values only | 🟢 Secure |
| **API Authentication** | ✅ Public endpoints | 🟢 Secure |
| **Database Access** | ✅ Firebase IAM | 🟢 Secure |
| **GitHub Repository** | ✅ No secrets exposed | 🟢 Secure |
| **Future Secrets** | 📋 Secret Manager ready | 🟢 Prepared |

---

## 🚀 Action Items

### Immediate (Phase 1) ✅ COMPLETE
- [x] Public environment variables in `apphosting.yaml`
- [x] No secrets in GitHub repository  
- [x] Firebase IAM authentication

### Next Phase (Phase 2) 📋 PLANNED
- [ ] Enable Secret Manager API when needed
- [ ] Create FlyWire API key secrets (if required)
- [ ] Update `apphosting.yaml` to reference secrets
- [ ] Test secret access in deployed application

### Future Phases (Phase 3+) 📋 PLANNED  
- [ ] User authentication secrets (JWT)
- [ ] External database credentials
- [ ] Third-party API keys
- [ ] Secret rotation automation 