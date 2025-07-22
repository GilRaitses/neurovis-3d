#!/usr/bin/env python3
"""
FlyWire Local Data Backend - No API calls, no SSL issues!
Uses downloaded FlyWire datasets for mechanosensory neuron visualization
"""

import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import List, Dict, Any
from pathlib import Path
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS for Firebase frontend
CORS(app, origins=[
    'https://neurovis-3d.web.app',
    'https://neurovis-3d.firebaseapp.com', 
    'http://localhost:4200',
    'http://0.0.0.0:4200'
])

class FlyWireLocalService:
    """FlyWire service using local downloaded data - no API calls needed!"""
    
    def __init__(self, data_dir="flywire_data"):
        self.data_dir = Path(data_dir)
        self.neuron_data = None
        self.mechanosensory_circuit = None
        self.load_local_data()
    
    def load_local_data(self):
        """Load the downloaded FlyWire data"""
        try:
            # Load neuron annotations
            annotations_file = self.data_dir / "Supplemental_file1_neuron_annotations.tsv"
            if annotations_file.exists():
                logger.info("📊 Loading neuron annotations...")
                self.neuron_data = pd.read_csv(annotations_file, sep='\t', low_memory=False)
                logger.info(f"✅ Loaded {len(self.neuron_data):,} neurons")
            
            # Load pre-processed mechanosensory circuit
            circuit_file = self.data_dir / "mechanosensory_circuit.json"
            if circuit_file.exists():
                logger.info("🎯 Loading mechanosensory circuit...")
                with open(circuit_file) as f:
                    self.mechanosensory_circuit = json.load(f)
                logger.info(f"✅ Loaded {len(self.mechanosensory_circuit['neurons'])} mechanosensory neurons")
            
            logger.info("🚀 Local FlyWire data loaded successfully - no API needed!")
            
        except Exception as e:
            logger.error(f"Failed to load local data: {e}")
            raise
    
    def get_circuits(self) -> List[Dict[str, Any]]:
        """Get available circuits from local data"""
        circuits = []
        
        if self.mechanosensory_circuit:
            circuits.append(self.mechanosensory_circuit)
        
        # Add more circuit types if needed
        if self.neuron_data is not None:
            # Auditory circuit
            auditory_neurons = self.get_auditory_neurons(limit=30)
            if auditory_neurons:
                circuits.append({
                    'name': 'Auditory Circuit (JO)',
                    'neurons': auditory_neurons,
                    'type': 'auditory',
                    'color': '#2196F3',
                    'source': 'flywire_local_data'
                })
        
        return circuits
    
    def get_mechanosensory_neurons(self, limit=50) -> List[Dict[str, Any]]:
        """Get mechanosensory neurons from local data"""
        if self.mechanosensory_circuit:
            return self.mechanosensory_circuit['neurons'][:limit]
        return []
    
    def get_auditory_neurons(self, limit=50) -> List[Dict[str, Any]]:
        """Get auditory neurons (JO types) from local data"""
        if self.neuron_data is None:
            return []
        
        try:
            # Get JO (Johnston's Organ) neurons
            jo_mask = self.neuron_data['cell_type'].str.contains('JO-', na=False)
            jo_neurons = self.neuron_data[jo_mask]
            
            neurons = []
            for _, row in jo_neurons.head(limit).iterrows():
                neuron = {
                    'id': str(row['root_id']),
                    'type': row['cell_type'],
                    'position': [float(row['pos_x']), float(row['pos_y']), float(row['pos_z'])],
                    'soma_position': [float(row['soma_x']), float(row['soma_y']), float(row['soma_z'])],
                    'activity': 0.0,
                    'mesh_id': row['root_id'],
                    'confidence': 1.0,
                    'source': 'flywire_local_data',
                    'super_class': row['super_class'],
                    'cell_class': row['cell_class'],
                    'side': row['side'] if pd.notna(row['side']) else 'unknown'
                }
                neurons.append(neuron)
            
            logger.info(f"Found {len(neurons)} auditory neurons")
            return neurons
            
        except Exception as e:
            logger.error(f"Failed to get auditory neurons: {e}")
            return []
    
    def search_neurons_by_type(self, cell_type: str, limit=20) -> List[Dict[str, Any]]:
        """Search neurons by cell type"""
        if self.neuron_data is None:
            return []
        
        try:
            mask = self.neuron_data['cell_type'].str.contains(cell_type, case=False, na=False)
            matching_neurons = self.neuron_data[mask]
            
            neurons = []
            for _, row in matching_neurons.head(limit).iterrows():
                neuron = {
                    'id': str(row['root_id']),
                    'type': row['cell_type'],
                    'position': [float(row['pos_x']), float(row['pos_y']), float(row['pos_z'])],
                    'soma_position': [float(row['soma_x']), float(row['soma_y']), float(row['soma_z'])],
                    'activity': 0.0,
                    'mesh_id': row['root_id'],
                    'confidence': 1.0,
                    'source': 'flywire_local_data',
                    'super_class': row['super_class'],
                    'cell_class': row['cell_class']
                }
                neurons.append(neuron)
            
            return neurons
            
        except Exception as e:
            logger.error(f"Failed to search neurons: {e}")
            return []

# Initialize service
flywire_service = FlyWireLocalService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'flywire_local_backend',
        'data_source': 'local_files',
        'ssl_issues': 'resolved',
        'neurons_available': len(flywire_service.neuron_data) if flywire_service.neuron_data is not None else 0
    })

@app.route('/api/circuits/search', methods=['GET'])
def search_circuits():
    """Search for neural circuits - using local data"""
    try:
        circuits = flywire_service.get_circuits()
        
        return jsonify({
            'success': True,
            'circuits': circuits,
            'total_circuits': len(circuits),
            'data_source': 'flywire_local_data',
            'message': 'Circuits loaded from local FlyWire data - no API calls needed!'
        })
        
    except Exception as e:
        logger.error(f"Circuit search failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data_source': 'flywire_local_data',
            'circuits': []
        }), 500

@app.route('/api/neurons/mechanosensory', methods=['GET'])
def get_mechanosensory():
    """Get mechanosensory neurons from local data"""
    try:
        limit = request.args.get('limit', 50, type=int)
        neurons = flywire_service.get_mechanosensory_neurons(limit=limit)
        
        return jsonify({
            'success': True,
            'neurons': neurons,
            'total_found': len(neurons),
            'data_source': 'flywire_local_data'
        })
        
    except Exception as e:
        logger.error(f"Mechanosensory query failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'neurons': []
        }), 500

@app.route('/api/neurons/search', methods=['GET'])
def search_neurons():
    """Search neurons by type from local data"""
    try:
        cell_type = request.args.get('type', 'mechanosensory')
        limit = request.args.get('limit', 20, type=int)
        
        neurons = flywire_service.search_neurons_by_type(cell_type, limit=limit)
        
        return jsonify({
            'success': True,
            'neurons': neurons,
            'search_type': cell_type,
            'total_found': len(neurons),
            'data_source': 'flywire_local_data'
        })
        
    except Exception as e:
        logger.error(f"Neuron search failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'neurons': []
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dataset statistics"""
    try:
        stats = {}
        
        if flywire_service.neuron_data is not None:
            df = flywire_service.neuron_data
            stats = {
                'total_neurons': len(df),
                'mechanosensory_neurons': len(df[df['cell_class'] == 'mechanosensory']),
                'auditory_neurons': len(df[df['cell_type'].str.contains('JO-', na=False)]),
                'sensory_neurons': len(df[df['super_class'] == 'sensory']),
                'top_cell_types': df['cell_type'].value_counts().head(10).to_dict(),
                'data_source': 'local_flywire_data',
                'ssl_status': 'not_needed'
            }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Stats query failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0' if os.environ.get('PORT') else 'localhost'
    
    logger.info(f"🚀 Starting FlyWire Local Backend on {host}:{port}")
    logger.info("✅ No SSL issues - using local data!")
    
    app.run(host=host, port=port, debug=True) 