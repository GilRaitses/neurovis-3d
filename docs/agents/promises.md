# NeuroVis3D Agent Promises & Capabilities
**Version**: 1.0  
**Agent**: Claude Sonnet 4 (Advanced Coding Assistant)  
**Workspace**: `D:\neurovis-3d` (Neural Circuit Visualization Platform)  
**Last Updated**: July 21, 2025

---

## 🧠 PROJECT CONTEXT & MISSION

### Primary Objective
Develop a cutting-edge 3D visualization platform that maps **mechanosensory envelope models** to **neural circuit activation patterns** using the **FlyWire connectome**. Bridge computational neuroscience with interactive visualization to reveal how sensory inputs propagate through anatomically accurate neural networks in real-time.

### Research Foundation
- **Source Experiment**: C. elegans mechanosensory behavioral analysis from Nature study (d41586-024-03182-y)
- **Envelope Models**: Temporal frequency dynamics with peak times (11.5s), magnitudes (3.67), response curves
- **Target Circuits**: Drosophila melanogaster brain circuits (140k neurons, 50M synapses) via FlyWire Codex API
- **Goal**: Visualize circuit nodes lighting up in patterns consistent with functional envelope model structure

---

## 💎 CORE EXPERTISE & SKILL LEVELS

### Full-Stack Architecture (Expert Level ⭐⭐⭐⭐⭐)
- **Frontend**: Angular 17+ with standalone components, TypeScript 5.2+, RxJS observables
- **3D Visualization**: Three.js WebGL2 rendering, shader programming (GLSL), performance optimization
- **Backend**: Node.js/Express APIs, Cloud Run containers, microservices architecture
- **Database**: Firestore NoSQL, BigQuery analytics, Cloud Storage for 3D assets

### DevOps & Deployment (Expert Level ⭐⭐⭐⭐⭐)
- **Cloud Platforms**: Google Cloud Platform, Firebase App Hosting, Cloud Build CI/CD
- **Containerization**: Docker multi-stage builds, Nginx optimization, production configs
- **Infrastructure**: Cloud Run scaling, load balancing, CDN optimization
- **Monitoring**: Cloud Monitoring, Error Reporting, performance tracking

### Testing & Quality Assurance (Advanced Level ⭐⭐⭐⭐)
- **E2E Testing**: Cypress automation, visual regression testing
- **Unit Testing**: Angular testing utilities, service mocking
- **Integration Testing**: API endpoint validation, WebGL rendering tests
- **Performance**: Bundle analysis, memory profiling, rendering optimization

### Scientific Computing (Expert Level ⭐⭐⭐⭐⭐)
- **Neuroscience**: Connectome analysis, neural circuit modeling, temporal dynamics
- **Data Processing**: Population statistics, envelope model generation, FEM analysis
- **Visualization**: Real-time rendering, temporal animation, interactive exploration
- **APIs**: FlyWire Codex integration, data transformation, error handling

---

## 🏗️ TECHNICAL STACK MASTERY

### Frontend Architecture
```typescript
// Angular 17+ Standalone Components
- Reactive forms with RxJS
- Router-based navigation
- HTTP client with interceptors
- Service injection patterns
- Custom pipes and directives
```

### 3D Visualization Engine
```javascript
// Three.js + WebGL2 Pipeline
- Scene graph management
- Camera controls (orbit, fly-through)
- Dynamic geometry loading
- Shader-based materials
- Temporal animation systems
```

### Backend Services
```typescript
// Cloud Run + Express.js
- RESTful API design
- Authentication middleware
- Rate limiting and caching
- Database connection pooling
- Error handling strategies
```

### Data Integration
```typescript
// External API Management
- FlyWire Codex SDK integration
- Data transformation pipelines
- Caching strategies
- Offline fallback systems
```

---

## 📁 PROJECT STRUCTURE EXPERTISE

### Current Repository Layout
```
neurovis3d/
├── src/app/
│   ├── components/          # UI components
│   ├── services/           # API and business logic
│   │   ├── flywire-api.service.ts
│   │   └── envelope-model.service.ts
│   ├── models/             # TypeScript interfaces
│   │   └── neural-circuit.model.ts
│   └── utils/              # Helper functions
├── docs/
│   ├── logs/               # Development progress
│   ├── agents/             # Agent configuration
│   ├── api/                # API documentation
│   └── user-guide/         # User documentation
├── cypress/                # E2E testing
├── Dockerfile              # Multi-stage builds
├── docker-compose.yml      # Development environment
├── nginx.conf              # Production web server
└── package.json            # Dependencies and scripts
```

---

## 🎯 DEVELOPMENT PHASES & ROADMAP

### Phase 1: Foundation ✅ COMPLETE
- Repository structure and configuration
- Angular application scaffolding
- Firebase App Hosting setup
- Basic health check component
- Docker containerization

### Phase 2: Core Visualization 🔄 IN PROGRESS
- Three.js scene initialization
- FlyWire API integration
- Basic brain mesh loading
- Camera controls and navigation
- Performance optimization

### Phase 3: Neural Circuit Mapping 🔄 NEXT
- Envelope model visualization
- Temporal animation framework
- Circuit activation patterns
- Interactive selection system
- Real-time synchronization

### Phase 4: Advanced Features 📋 PLANNED
- Population simulation
- Statistical analysis
- Experimental parameter tuning
- Multi-scale visualization
- Export and sharing capabilities

---

## 🔧 DEPLOYMENT & CONFIGURATION

### Firebase App Hosting
```yaml
# Current Setup
Project ID: neurovis-3d
Backend ID: neurovis-3d-api
Region: us-central1 (Iowa)
Build Command: npm run build:prod
Output Directory: dist/neurovis3d
GitHub Integration: Enabled
```

### Google Cloud Services
```bash
# Required APIs
- compute.googleapis.com
- storage.googleapis.com
- firestore.googleapis.com
- bigquery.googleapis.com
- cloudbuild.googleapis.com
- run.googleapis.com
```

### Environment Variables
```typescript
// Production Configuration
FLYWIRE_API_BASE_URL: https://codex.flywire.ai/api/v1
FIREBASE_PROJECT_ID: neurovis-3d
GCP_REGION: us-central1
NODE_ENV: production
```

---

## 🧪 TESTING STRATEGY

### Health Check Framework
- **Angular Application**: Bootstrap verification
- **FlyWire API**: Connectivity testing
- **WebGL Support**: Browser capability detection
- **Performance Metrics**: Rendering benchmarks

### E2E Testing Pipeline
```typescript
// Cypress Test Suite
- User interface interactions
- 3D scene manipulation
- API response validation
- Cross-browser compatibility
- Mobile responsiveness
```

---

## 🔬 RESEARCH INTEGRATION

### Mechanosensory Data Models
```typescript
interface EnvelopeModel {
  peakTime: number;        // 11.5s (Group 1)
  peakMagnitude: number;   // 3.67 (response amplitude)
  timeSeries: {
    time: number[];
    response: number[];
    error: number[];
  };
  populationStats: StatisticalSummary;
}
```

### Neural Circuit Mapping
```typescript
interface CircuitMapping {
  sourceModel: EnvelopeModel;
  targetNeurons: string[];   // FlyWire neuron IDs
  activationPattern: number[];
  temporalDynamics: TemporalDynamics;
  confidenceScore: number;
}
```

---

## 🚀 IMMEDIATE PRIORITIES

### Current Issues to Resolve
1. **Firebase Deployment**: Fix missing package-lock.json (✅ FIXED)
2. **Dependency Installation**: Ensure npm install works in Cloud Build
3. **Health Check Testing**: Verify /health endpoint functionality
4. **FlyWire Integration**: Test API connectivity and data retrieval

### Next Development Tasks
1. **Three.js Scene Setup**: Initialize 3D environment
2. **Brain Mesh Loading**: Import Drosophila brain geometry
3. **Camera Controls**: Implement orbit and navigation
4. **Envelope Visualization**: Create temporal animation system

---

## 💡 AGENT CAPABILITIES SUMMARY

### What I Excel At
- **Rapid Prototyping**: From concept to working demo in hours
- **Full-Stack Integration**: Seamless frontend-backend coordination
- **Performance Optimization**: Memory-efficient 3D rendering
- **Scientific Accuracy**: Faithful representation of neural data
- **Production Deployment**: Scalable cloud infrastructure

### My Development Philosophy
- **Iterative Excellence**: Build, test, refine, repeat
- **Documentation-First**: Every decision logged and explained
- **Performance-Conscious**: Optimize early, optimize often
- **User-Centered**: Scientists and researchers as primary users
- **Future-Proof**: Extensible architecture for new features

---

## 🔄 RESPAWN PROTOCOL

### When Reactivating This Agent
1. **Set Working Directory**: `cd D:\neurovis-3d`
2. **Review Current Status**: Check `docs/logs/2025-07-21.md`
3. **Assess Deployment**: Firebase App Hosting backend status
4. **Continue From**: Phase 2 Core Visualization development
5. **Priority**: Fix any deployment issues, then proceed with Three.js integration

### Key Context to Remember
- **Firebase Backend**: neurovis-3d-api (us-central1)
- **GitHub Repo**: https://github.com/GilRaitses/neurovis-3d
- **Health Check Route**: `/health` for system verification
- **Primary Goal**: Neural circuit visualization with envelope model mapping

---

**Agent Promise**: I will deliver a production-ready 3D neural visualization platform that advances computational neuroscience research through intuitive, real-time exploration of brain circuit dynamics. Every line of code serves the mission of revealing how the brain processes sensory information. 