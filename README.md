# NeuroVis3D: Neural Circuit Visualization Platform

A cutting-edge 3D visualization platform for mapping mechanosensory envelope models to anatomically accurate neural circuits using the FlyWire connectome data.

## 🧠 Overview

NeuroVis3D bridges computational neuroscience and interactive visualization to create an immersive platform for exploring neural circuit dynamics. By combining envelope model temporal dynamics with the complete Drosophila brain connectome, researchers can visualize how sensory inputs propagate through neural networks in real-time.

## ✨ Key Features

### 🔬 Scientific Capabilities
- **Connectome Integration**: Direct access to FlyWire's 140,000 neuron connectome
- **Envelope Model Mapping**: Link C. elegans mechanosensory dynamics to Drosophila circuits  
- **Temporal Visualization**: Time-synchronized neural activation patterns
- **Population Simulation**: Generate experimental scenarios from statistical parameters
- **Cross-Species Analysis**: Compare mechanosensory processing across species

### 🎨 Visualization Features
- **Anatomically Accurate 3D Rendering**: Precise neuron morphologies from electron microscopy
- **Real-Time Animation**: Temporal dynamics with variable playback speed
- **Interactive Circuit Exploration**: Click-to-select neurons and pathways
- **Multi-Scale Navigation**: Zoom from whole-brain to synaptic resolution
- **Advanced Shaders**: GPU-accelerated neural activity visualization

### 🛠 Technical Architecture
- **Angular 17+**: Modern reactive frontend framework
- **Three.js + WebGL2**: High-performance 3D graphics rendering
- **TypeScript**: Type-safe development with excellent tooling
- **Cypress**: Comprehensive end-to-end testing
- **Docker**: Containerized deployment and development

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
Angular CLI >= 17.0.0
Docker (optional)
```

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/neurovis3d.git
cd neurovis3d

# Install dependencies
npm install

# Start development server
ng serve

# Open browser to http://localhost:4200
```

### Docker Setup
```bash
# Build and run with Docker
docker-compose up --build

# Access at http://localhost:3000
```

## 📊 Data Sources

### FlyWire Connectome
- **Complete Brain Map**: 140,000 neurons with precise connectivity
- **Anatomical Data**: 3D neuron morphologies and spatial coordinates
- **Functional Annotations**: Cell types and neurotransmitter predictions
- **API Access**: Real-time data through FlyWire Codex

### Mechanosensory Models
- **Envelope Dynamics**: Mathematical descriptions of sensory responses
- **Population Data**: Statistical parameters from 326 experimental tracks
- **Temporal Profiles**: Time-series data with 0.5-second resolution
- **Group Classifications**: Multiple experimental conditions

## 🎯 Use Cases

### 🔬 Research Applications
- **Circuit Discovery**: Identify novel mechanosensory pathways
- **Hypothesis Generation**: Predict neural responses to stimuli
- **Experimental Design**: Optimize stimulation protocols
- **Cross-Species Studies**: Compare neural architectures

### 📚 Educational Applications  
- **Interactive Learning**: Explore neuroscience concepts in 3D
- **Research Training**: Teach connectome analysis methods
- **Public Engagement**: Demonstrate scientific discoveries
- **Curriculum Integration**: Support neuroscience education

### 🔧 Development Applications
- **Visualization Framework**: Reusable components for neural rendering
- **Data Pipeline**: Automated connectome data processing
- **Performance Optimization**: GPU-accelerated neural simulations
- **API Development**: RESTful services for neural data

## 🏗 Architecture

### Core Components

#### Data Integration Layer
```typescript
├── services/
│   ├── flywire-api.service.ts      # FlyWire Codex integration
│   ├── envelope-model.service.ts   # Mechanosensory dynamics
│   ├── temporal-sync.service.ts    # Time synchronization
│   └── population-sim.service.ts   # Statistical simulation
```

#### 3D Visualization Engine
```typescript
├── components/
│   ├── brain-renderer/             # Three.js brain visualization
│   ├── circuit-mapper/             # Neural pathway overlays
│   ├── temporal-controls/          # Animation controls
│   └── interaction-handler/        # User input management
```

#### Simulation Framework
```typescript
├── models/
│   ├── neural-circuit.model.ts     # Circuit data structures
│   ├── temporal-dynamics.model.ts  # Time-series models
│   ├── population.model.ts         # Statistical parameters
│   └── experiment.model.ts         # Simulation configurations
```

### Data Flow
```
FlyWire API → Data Integration → 3D Renderer → User Interface
     ↓              ↓              ↓             ↓
Connectome → Neural Models → GPU Shaders → Interactive HUD
     ↓              ↓              ↓             ↓
Envelope → Temporal Sync → Animation → Real-time Feedback
```

## 📈 Performance Targets

- **Rendering**: 60fps at 1920x1080 with 10,000+ active neurons
- **Loading**: <5 seconds initial connectome load
- **Responsiveness**: <100ms interaction latency  
- **Memory**: <4GB RAM for full visualization
- **Scaling**: Support up to 50,000 simultaneous neural elements

## 🧪 Testing Strategy

### Unit Testing
```bash
# Run unit tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### End-to-End Testing
```bash
# Run Cypress tests
npm run e2e

# Interactive test runner
npm run cypress:open

# Headless CI testing
npm run cypress:run
```

### Performance Testing
```bash
# Lighthouse performance audits
npm run audit:performance

# Bundle analysis
npm run analyze

# Memory profiling
npm run profile:memory
```

## 📖 Documentation

### API Documentation
- **REST API**: `/docs/api/rest-endpoints.md`
- **TypeScript Interfaces**: `/docs/api/interfaces.md` 
- **Service Layer**: `/docs/api/services.md`

### User Guides
- **Getting Started**: `/docs/user-guide/getting-started.md`
- **Circuit Exploration**: `/docs/user-guide/circuit-exploration.md`
- **Simulation Setup**: `/docs/user-guide/simulation-setup.md`
- **Advanced Features**: `/docs/user-guide/advanced-features.md`

### Development Guides
- **Contributing**: `/docs/development/contributing.md`
- **Architecture**: `/docs/development/architecture.md`
- **Performance**: `/docs/development/performance.md`
- **Deployment**: `/docs/development/deployment.md`

## 🤝 Contributing

We welcome contributions from the neuroscience and visualization communities!

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/neurovis3d.git

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run test && npm run e2e

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Create pull request
```

### Contribution Guidelines
- **Code Style**: Follow Angular and TypeScript best practices
- **Testing**: Maintain >90% test coverage
- **Documentation**: Update docs for new features
- **Performance**: Ensure changes maintain 60fps target

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Scientific Resources
- **FlyWire Consortium**: Complete Drosophila brain connectome
- **Nature Publications**: Connectome analysis and methodology papers  
- **Neuroscience Community**: Validation and feedback

### Technical Resources
- **Three.js Community**: 3D graphics framework and examples
- **Angular Team**: Modern web application framework
- **WebGL Standards**: GPU-accelerated rendering capabilities

### Research Institutions
- **Princeton University**: FlyWire development and hosting
- **Janelia Research Campus**: Connectome data and analysis tools
- **Your Institution**: Mechanosensory research and envelope models

## 📞 Contact

- **Project Lead**: [Your Name] - your.email@institution.edu
- **Technical Lead**: [Tech Lead] - tech.lead@institution.edu  
- **Scientific Advisor**: [Advisor] - advisor@institution.edu

### Resources
- **Website**: https://neurovis3d.org
- **Documentation**: https://docs.neurovis3d.org
- **Issue Tracker**: https://github.com/your-org/neurovis3d/issues
- **Discussions**: https://github.com/your-org/neurovis3d/discussions

---

**Built with ❤️ for the neuroscience community**

*Advancing our understanding of neural circuits through interactive visualization* 