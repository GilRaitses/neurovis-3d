# FlyWire Cloud Data Solution - Deployment Guide

**🎯 Problem Solved**: SSL issues with `cave.flywire.ai` completely eliminated!

## 🌟 Solution Overview

Instead of calling the FlyWire CAVE API directly (which has SSL issues), we:

1. **Load official FlyWire data from GitHub** (the same data, no SSL issues)
2. **Process it in the cloud** (no large local files)
3. **Serve it via our backend** (same API your frontend expects)

## 📊 What You Get

- ✅ **139,255 total neurons** from FlyWire
- ✅ **2,648 mechanosensory neurons** 
- ✅ **1,107 auditory neurons** (JO-A, JO-B, JO-E, JO-F types)
- ✅ **Complete 3D positions** for all neurons
- ✅ **Cell type classifications** for research
- ✅ **No SSL certificate issues**
- ✅ **No mock data** - 100% real FlyWire data
- ✅ **Cloud deployment ready**

## 🚀 Deployment Options

### Option 1: Google Cloud Run (Recommended)

Perfect for your existing setup since you're already using Google Cloud.

**1. Create Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY flywire_cloud_backend.py .

CMD python flywire_cloud_backend.py
```

**2. Create requirements.txt:**
```
flask==3.1.1
flask-cors==6.0.1
pandas==2.3.1
requests==2.32.3
```

**3. Deploy:**
```bash
gcloud run deploy neuroglancer-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

### Option 2: Heroku

**1. Create Procfile:**
```
web: python flywire_cloud_backend.py
```

**2. Deploy:**
```bash
git add .
git commit -m "Add cloud FlyWire backend"
git push heroku main
```

### Option 3: Any Docker Platform

The `flywire_cloud_backend.py` works on any platform that supports Python + Docker.

## 🔧 Integration with Your Frontend

**Update your Angular service** (`src/app/services/python-neuroglancer.service.ts`):

```typescript
private getBackendUrl(): string {
  // Point to your deployed cloud backend
  return 'https://your-cloud-backend-url.com/api';
}
```

## 📡 API Endpoints

Your cloud backend provides the same APIs your frontend expects:

- `GET /api/health` - Health check with data statistics
- `GET /api/circuits/search` - Get available neural circuits  
- `GET /api/neurons/mechanosensory` - Get mechanosensory neurons
- `GET /api/neurons/search?type=JO` - Search neurons by type
- `GET /api/stats` - Dataset statistics
- `POST /api/refresh` - Force refresh cloud data

## 🎯 Benefits

### 🚫 **Eliminates SSL Issues**
- No direct calls to `cave.flywire.ai`
- No SSL certificate configuration needed
- No `NODE_TLS_REJECT_UNAUTHORIZED` workarounds

### ☁️ **Cloud-Native**
- Loads data from GitHub on startup
- Smart caching (24-hour refresh cycle)
- No large files in your deployment
- Scales automatically

### 🔬 **Scientific Integrity**
- Uses official FlyWire data from `flyconnectome/flywire_annotations`
- Same data as the research papers
- No mock data or fallbacks
- Real neuron positions and classifications

### ⚡ **Performance**
- GitHub CDN for fast downloads
- In-memory caching after first load
- Pandas for efficient data processing
- RESTful APIs for frontend integration

## 🧪 Testing

Test your deployed backend:

```bash
# Health check
curl https://your-backend-url.com/api/health

# Get mechanosensory neurons
curl https://your-backend-url.com/api/neurons/mechanosensory?limit=10

# Get circuit data
curl https://your-backend-url.com/api/circuits/search
```

## 📈 Monitoring

Monitor your cloud backend:

- **Cache status**: Check `/api/health` for cache age
- **Data freshness**: Use `/api/refresh` to force refresh
- **Statistics**: Check `/api/stats` for data counts
- **Errors**: Monitor logs for any GitHub connectivity issues

## 🔄 Data Updates

The backend automatically:
- **Refreshes data every 24 hours**
- **Loads from GitHub on startup**
- **Caches in memory for performance**
- **Provides manual refresh endpoint**

## 🛠️ Troubleshooting

### Backend Won't Start
- Check Python dependencies in requirements.txt
- Verify internet connectivity for GitHub access
- Check logs for specific errors

### Frontend Can't Connect
- Verify backend URL in Angular service
- Check CORS configuration in backend
- Test backend health endpoint directly

### Data Not Loading
- Check GitHub connectivity
- Use `/api/refresh` to force reload
- Monitor `/api/health` for cache status

## 🎉 Success Metrics

Your cloud-based FlyWire solution is working when:

- ✅ `/api/health` returns 139,255+ neurons
- ✅ `/api/circuits/search` returns mechanosensory and auditory circuits
- ✅ No SSL errors in logs
- ✅ Frontend displays real neuron data
- ✅ No `cave.flywire.ai` calls in network logs

## 📞 Support

If you need help:
1. Check this deployment guide
2. Test with `run_cloud_demo.py` 
3. Verify endpoints with `test_cloud_backend.py`
4. Monitor backend logs for errors

**Your SSL issues are now completely solved! 🚀** 