#!/usr/bin/env python3
"""
CHRIMSON Neuroglancer Backend
Real FlyWire larval circuit visualization with red light optogenetics
"""

import neuroglancer
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

class CHRIMSONNeuroglancerService:
    """Service for CHRIMSON larval circuit visualization"""
    
    def __init__(self):
        self.viewer = None
        self.current_circuits = []
        
        # CHRIMSON neuron types for 2nd instar larvae
        self.chrimson_types = [
            'CHRIMSON_mechanosensory_larval',
            'CHRIMSON_touch_receptor_larval', 
            'CHRIMSON_stretch_receptor_larval',
            'CHRIMSON_campaniform_larval',
            'CHRIMSON_proprioceptor_larval',
            'CHRIMSON_nociceptor_larval'
        ]
        
        # Additional larval types
        self.larval_types = [
            'CO2_sensory_neuron_larval',
            'mechanosensory_neuron_larval',
            'touch_receptor_larval',
            'stretch_receptor_larval',
            'proprioceptor_larval',
            'chordotonal_organ_larval',
            'campaniform_sensilla_larval',
            'bristle_mechanosensory_larval',
            'photoreceptor_to_DN_circuit'
        ]
        
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize Neuroglancer viewer"""
        try:
            # Initialize Neuroglancer on a different port
            neuroglancer.set_server_bind_address('localhost', 9998)
            self.viewer = neuroglancer.Viewer()
            logger.info("✅ Neuroglancer viewer initialized on http://localhost:9998")
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            raise
    
    def search_chrimson_circuits(self) -> List[Dict[str, Any]]:
        """Search for CHRIMSON-expressing larval neurons"""
        try:
            circuits = []
            
            # Query for CHRIMSON neurons
            chrimson_neurons = self._query_neurons(self.chrimson_types)
            if chrimson_neurons:
                circuits.append({
                    'name': 'CHRIMSON Red Light Mechanosensory Circuit',
                    'neurons': chrimson_neurons,
                    'type': 'chrimson',
                    'color': '#FF4081'  # Pink for CHRIMSON
                })
            
            # Query for photoreceptor-DN circuit
            photoreceptor_neurons = self._query_neurons(['photoreceptor_to_DN_circuit'])
            if photoreceptor_neurons:
                circuits.append({
                    'name': 'Photoreceptor to DN Circuit', 
                    'neurons': photoreceptor_neurons,
                    'type': 'photoreceptor',
                    'color': '#E91E63'  # Deep pink
                })
            
            # Query for other larval circuits
            other_neurons = self._query_neurons(self.larval_types)
            if other_neurons:
                circuits.append({
                    'name': 'Larval Mechanosensory Circuits',
                    'neurons': other_neurons,
                    'type': 'larval',
                    'color': '#2196F3'  # Blue
                })
            
            self.current_circuits = circuits
            logger.info(f"🔍 Found {len(circuits)} circuit types")
            return circuits
            
        except Exception as e:
            logger.error(f"❌ Circuit search failed: {e}")
            return []
    
    def _query_neurons(self, neuron_types: List[str]) -> List[Dict[str, Any]]:
        """Generate mock neurons for demo purposes"""
        try:
            neurons = []
            
            for i, neuron_type in enumerate(neuron_types):
                # Create demo neuron data positioned in larval brain region
                neuron = {
                    'id': f'demo_{neuron_type}_{i}',
                    'type': neuron_type,
                    'position': [
                        50000 + np.random.randint(-10000, 10000),  # X in nm
                        30000 + np.random.randint(-10000, 10000),  # Y in nm  
                        20000 + np.random.randint(-5000, 5000)     # Z in nm
                    ],
                    'activity': 0.0
                }
                neurons.append(neuron)
            
            logger.info(f"📊 Generated {len(neurons)} demo neurons")
            return neurons
            
        except Exception as e:
            logger.error(f"❌ Neuron query failed: {e}")
            return []
    
    def create_neuroglancer_visualization(self) -> str:
        """Create Neuroglancer visualization of CHRIMSON circuits"""
        try:
            # Clear existing layers
            with self.viewer.txn() as s:
                s.layers.clear()
                
                # Set coordinate space (FlyWire FAFB coordinates)
                s.dimensions = neuroglancer.CoordinateSpace(
                    names=['x', 'y', 'z'],
                    units=['nm', 'nm', 'nm'],
                    scales=[1, 1, 1]
                )
                
                # Add circuit layers
                for circuit in self.current_circuits:
                    self._add_circuit_layer(s, circuit)
                
                # Set initial view
                s.position = [50000, 30000, 20000]  # Center of larval brain
                s.cross_section_scale = 100
                s.projection_scale = 1000
                s.layout = '4panel'
            
            url = str(self.viewer)
            logger.info(f"🎯 Neuroglancer URL: {url}")
            return url
            
        except Exception as e:
            logger.error(f"❌ Visualization creation failed: {e}")
            return ""
    
    def _add_circuit_layer(self, state, circuit: Dict[str, Any]):
        """Add a circuit as a Neuroglancer annotation layer"""
        try:
            annotations = []
            
            for neuron in circuit['neurons']:
                # Create point annotation for each neuron
                point = neuroglancer.PointAnnotation(
                    point=neuron['position'],
                    id=neuron['id'],
                    description=f"{circuit['name']}: {neuron['type']}\nActivity: {neuron.get('activity', 0):.2f}"
                )
                annotations.append(point)
            
            # Create annotation layer
            layer = neuroglancer.LocalAnnotationLayer(
                dimensions=state.dimensions,
                annotations=annotations
            )
            
            # Set layer properties
            layer.annotation_color = circuit['color']
            layer.visible = True
            
            state.layers[circuit['name']] = layer
            logger.info(f"➕ Added layer: {circuit['name']} ({len(annotations)} neurons)")
            
        except Exception as e:
            logger.error(f"❌ Failed to add circuit layer {circuit['name']}: {e}")
    
    def update_circuit_activity(self, fem_data: Dict[str, Any]):
        """Update circuit activity based on FEM data"""
        try:
            optogenetic_stimulus = fem_data.get('optogeneticStimulus', False)
            mechanical_force = fem_data.get('femParameters', {}).get('mechanicalForce', 0)
            timestamp = fem_data.get('timestamp', 0)
            peak_time = fem_data.get('peakTime', 11.5)
            
            # Calculate temporal factor (Gaussian around peak time)
            time_factor = np.exp(-abs(timestamp - peak_time) / 5.0)
            
            for circuit in self.current_circuits:
                for neuron in circuit['neurons']:
                    if 'CHRIMSON' in neuron['type']:
                        # CHRIMSON neurons respond strongly to red light
                        base_activity = 0.9 if optogenetic_stimulus else 0.05
                        mechanical_boost = mechanical_force * 0.15
                        neuron['activity'] = min(1.0, (base_activity + mechanical_boost) * time_factor)
                    
                    elif 'photoreceptor' in neuron['type'] or 'DN' in neuron['type']:
                        # Photoreceptor-DN circuit
                        base_activity = 0.8 if optogenetic_stimulus else 0.1
                        neuron['activity'] = base_activity * time_factor
                    
                    else:
                        # Other larval neurons
                        base_activity = mechanical_force * 0.1
                        neuron['activity'] = base_activity * time_factor
            
            # Update visualization
            self._update_visualization()
            logger.info(f"🔄 Updated activity for {len(self.current_circuits)} circuits")
            
        except Exception as e:
            logger.error(f"❌ Activity update failed: {e}")
    
    def _update_visualization(self):
        """Update the Neuroglancer visualization with new activity"""
        try:
            # Recreate layers with updated activity
            with self.viewer.txn() as s:
                # Clear annotation layers
                layers_to_remove = [name for name in s.layers.keys() 
                                  if any(circuit['name'] == name for circuit in self.current_circuits)]
                for layer_name in layers_to_remove:
                    del s.layers[layer_name]
                
                # Re-add with updated activity
                for circuit in self.current_circuits:
                    self._add_circuit_layer(s, circuit)
            
        except Exception as e:
            logger.error(f"❌ Visualization update failed: {e}")

# Global service instance
chrimson_service = CHRIMSONNeuroglancerService()

# Flask API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'neuroglancer_url': str(chrimson_service.viewer) if chrimson_service.viewer else None,
        'demo_mode': True  # Indicates we're using mock data
    })

@app.route('/api/circuits/search', methods=['GET'])
def search_circuits():
    """Search for CHRIMSON circuits"""
    try:
        circuits = chrimson_service.search_chrimson_circuits()
        return jsonify({
            'success': True,
            'circuits': circuits,
            'count': len(circuits)
        })
    except Exception as e:
        logger.error(f"Circuit search API error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/visualization/create', methods=['POST'])
def create_visualization():
    """Create Neuroglancer visualization"""
    try:
        url = chrimson_service.create_neuroglancer_visualization()
        return jsonify({
            'success': True,
            'neuroglancer_url': url
        })
    except Exception as e:
        logger.error(f"Visualization creation API error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/activity/update', methods=['POST'])
def update_activity():
    """Update circuit activity from FEM data"""
    try:
        fem_data = request.get_json()
        chrimson_service.update_circuit_activity(fem_data)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Activity update API error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/circuits/current', methods=['GET'])
def get_current_circuits():
    """Get current circuit data"""
    return jsonify({
        'success': True,
        'circuits': chrimson_service.current_circuits
    })

if __name__ == '__main__':
    logger.info("🚀 Starting CHRIMSON Neuroglancer Backend...")
    logger.info("🔴 CHRIMSON Red Light → Phantom Mechanosensation")
    logger.info("🧠 Demo Mode: Using mock larval circuits")
    logger.info("🎯 Neuroglancer: http://localhost:9998")
    logger.info("🔌 API: http://localhost:5000/api/health")
    
    app.run(
        host='localhost',
        port=5000,
        debug=True,
        threaded=True
    ) 