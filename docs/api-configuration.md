# API Configuration Guide

## FlyWire Codex API Setup

### 1. Getting API Access

To access real FlyWire connectome data, you need to:

1. **Register for FlyWire Access**:
   - Visit: https://codex.flywire.ai/
   - Create an account with institutional affiliation
   - Request API access for research purposes

2. **API Key Generation**:
   - Log into FlyWire Codex
   - Navigate to Settings > API Keys
   - Generate a new API key for NeuroVis3D
   - Copy the key (it won't be shown again)

### 2. Configuring API Key in NeuroVis3D

**Option A: Using the UI (Recommended)**
1. Open https://neurovis-3d.web.app
2. Expand "FlyWire API Configuration" panel
3. Paste your API key
4. Click "Save API Key"

**Option B: Environment Variables (Production)**
```bash
# For production deployment
FLYWIRE_API_KEY=your_api_key_here
```

**Option C: Browser Storage**
```javascript
// Set directly in browser console
localStorage.setItem('flywire_api_key', 'your_api_key_here');
```

### 3. API Endpoints Used

- **Base URL**: `https://codex.flywire.ai/api`
- **Circuits**: `/circuits/mechanosensory`
- **Neurons**: `/neurons/{neuron_id}`
- **Meshes**: `/neurons/{neuron_id}/mesh`
- **Connectivity**: `/connectivity`

## FEM Data Integration

### 1. Supported Data Formats

**JSON Format**:
```json
[
  {
    "timestamp": 0.0,
    "peakTime": 11.5,
    "magnitude": 3.67,
    "turnRate": [0.1, 0.2, 0.15],
    "co2Response": [0.05, 0.1, 0.08],
    "optogeneticStimulus": false,
    "femParameters": {
      "stimulusPosition": [10.0, 15.0, 5.0],
      "mechanicalForce": 2.5,
      "responsePattern": [0.1, 0.2, 0.15]
    }
  }
]
```

**CSV Format**:
```csv
timestamp,turnRate,co2Response,optogeneticStimulus,stimX,stimY,stimZ,mechanicalForce,responsePattern
0.0,0.1,0.05,false,10.0,15.0,5.0,2.5,0.1
0.1,0.2,0.1,false,10.1,15.1,5.0,2.6,0.2
```

### 2. FEM Analysis Parameters

Based on your mechanosensory CO2 response analysis:

- **Peak Time**: 11.5 seconds (from your analysis)
- **Peak Magnitude**: 3.67 (response strength)
- **Temporal Dynamics**: Gaussian response curve
- **Optogenetic Window**: 10-13 seconds (red light stimulation)

### 3. Circuit Mapping

The system maps FEM data to these neural circuits:

1. **CO2 Receptor Neurons**: Primary CO2 detection
2. **Mechanosensory Bristles**: Touch/mechanical sensing
3. **Campaniform Sensilla**: Proprioceptive feedback
4. **Motor Neurons (Flight)**: Wing movement control
5. **Motor Neurons (Leg)**: Leg movement control
6. **Interneurons**: Signal integration and processing

## Mock Data Mode

When no API key is provided, the system uses realistic mock data:

- **Gaussian Response**: Peak at 11.5s, magnitude 3.67
- **Temporal Dynamics**: Exponential decay from peak
- **Noise Simulation**: Realistic experimental variance
- **Circuit Models**: Simplified 2-circuit system

## Security Considerations

### API Key Storage

- **Local Development**: localStorage (temporary)
- **Production**: Environment variables only
- **Never**: Commit API keys to version control

### Data Privacy

- FEM data remains local unless explicitly shared
- API calls are cached for performance
- Service worker caches responses offline

## Troubleshooting

### Common Issues

1. **"API key required"**:
   - Ensure API key is properly configured
   - Check browser localStorage
   - Verify key format (no extra spaces)

2. **"Circuit mapping failed"**:
   - Check internet connectivity
   - Verify FlyWire API status
   - Try mock data mode first

3. **"File format not supported"**:
   - Ensure JSON/CSV format
   - Check file structure matches expected format
   - Validate data types (numbers vs strings)

### Debug Mode

Open browser console and check for:
```javascript
// Check API authentication
console.log(localStorage.getItem('flywire_api_key'));

// Check loaded data
console.log('FEM data points:', window.femData?.length);
console.log('Mapped circuits:', window.circuits?.length);
```

## Example Workflow

1. **Load FEM Data**:
   - Use mock data for initial testing
   - Upload your analysis files (JSON/CSV)
   - Configure optogenetic/CO2 parameters

2. **Configure API**:
   - Add FlyWire API key
   - Verify authentication status
   - Test with simple neuron query

3. **Map to Circuits**:
   - Load mechanosensory circuits
   - Apply FEM temporal dynamics
   - Visualize in 3D brain viewer

4. **Analyze Results**:
   - Examine circuit activation patterns
   - Compare with experimental predictions
   - Export results for further analysis

## Citation

When using FlyWire data in publications:

```
Dorkenwald, S., et al. (2024). FlyWire: online community for whole-brain connectomics. 
Nature Methods. https://doi.org/10.1038/s41592-024-02330-0
``` 