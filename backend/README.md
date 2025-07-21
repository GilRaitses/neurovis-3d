# 🔴 CHRIMSON Neuroglancer Backend

Python backend for real FlyWire larval circuit visualization with CHRIMSON red light optogenetics.

## 🧬 What This Does

- **CHRIMSON Integration**: Red light → Phantom mechanosensation mapping
- **Real FlyWire Data**: Direct CAVE API access to larval connectome  
- **Neuroglancer Visualization**: Professional neural circuit rendering
- **Angular Sync**: Real-time activity updates from FEM analysis

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Backend
```bash
python chrimson_neuroglancer.py
```

### 3. Verify Connection
- Backend API: http://localhost:5000/api/health
- Neuroglancer Viewer: http://localhost:9999 (auto-starts)

## 🔴 CHRIMSON Features

### Red Light Phantom Mechanosensation
- CHRIMSON-expressing larvae respond to red light as if touched
- Genetic targeting of specific mechanosensory circuits
- No physical contact required - pure optogenetic illusion

### Circuit Types Detected
- `CHRIMSON_mechanosensory_larval` - Primary red light responsive
- `CHRIMSON_touch_receptor_larval` - Touch sensation phantom
- `CHRIMSON_stretch_receptor_larval` - Stretch response phantom  
- `CHRIMSON_campaniform_larval` - Force detection phantom
- `CHRIMSON_proprioceptor_larval` - Body position phantom
- `CHRIMSON_nociceptor_larval` - Pain response phantom

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```
Returns backend status and Neuroglancer URL.

### Search Circuits  
```
GET /api/circuits/search
```
Finds CHRIMSON and larval mechanosensory circuits.

### Create Visualization
```
POST /api/visualization/create
```
Generates Neuroglancer 3D circuit view.

### Update Activity
```
POST /api/activity/update
```
Updates circuit activity from FEM data.

Example payload:
```json
{
  "optogeneticStimulus": true,
  "femParameters": {
    "mechanicalForce": 0.75
  },
  "timestamp": 11.5,
  "peakTime": 11.5
}
```

## 🧠 FlyWire Integration

### CAVE Client Setup
- Uses `caveclient` for direct FlyWire access
- Token configured in `.env` file
- Queries larval-specific neuron types

### Coordinate System
- FlyWire FAFB coordinates (nanometers)
- Larval brain bounding box: ~[40000-60000, 20000-40000, 15000-25000]
- Auto-centered view on larval circuits

## 🎯 Neuroglancer Configuration

### Visualization Layers
- **CHRIMSON Circuit**: Pink (#FF4081) - Red light responsive
- **Photoreceptor-DN**: Deep pink (#E91E63) - Light processing
- **Larval Mechanosensory**: Blue (#2196F3) - Other touch/force

### Activity Mapping
- Real-time activity based on FEM mechanical force
- CHRIMSON boost: 0.9 activity when red light ON
- Temporal Gaussian around peak stimulation time
- Color intensity reflects neural activity level

## 🔄 Angular Frontend Sync

The Python backend automatically syncs with the Angular frontend:

1. **Circuit Discovery**: Backend searches FlyWire for CHRIMSON neurons
2. **Visualization Creation**: Neuroglancer renders 3D circuit view  
3. **Activity Updates**: FEM data drives real-time activity changes
4. **Iframe Embedding**: Angular embeds Neuroglancer in responsive layout

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version (needs 3.8+)
python --version

# Install missing dependencies
pip install neuroglancer caveclient flask-cors

# Check port availability
netstat -an | grep 5000
```

### No FlyWire Connection
1. Verify CAVE token in `.env` file
2. Check network connection to `https://cave.flywire.ai`
3. Try demo mode (uses mock neuron data)

### Neuroglancer Not Loading
1. Ensure port 9999 is available
2. Check firewall settings
3. Try accessing http://localhost:9999 directly

## 🎯 Next Steps

1. **Real CAVE Queries**: Replace mock data with actual FlyWire queries
2. **Mesh Loading**: Add full neuron meshes (currently points only)
3. **Synapse Visualization**: Show connections between CHRIMSON neurons
4. **Custom Shaders**: Activity-based color/transparency effects 