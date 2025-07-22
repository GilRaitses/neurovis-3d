#!/usr/bin/env python3
"""
FlyWire Cloud Data Backend - Load datasets from cloud storage
Eliminates SSL issues by using pre-downloaded data hosted in the cloud
"""

import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import List, Dict, Any
import requests
import io
import os
from datetime import datetime, timedelta

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

class FlyWireCloudDataService:
    """FlyWire service using cloud-hosted downloaded data - no SSL API issues!"""
    
    def __init__(self):
        # Cloud URLs for our pre-downloaded FlyWire data
        self.data_urls = {
            'neuron_annotations': 'https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main/supplemental_files/Supplemental_file1_neuron_annotations.tsv',
            'non_neuron_annotations': 'https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main/supplemental_files/Supplemental_file2_non_neuron_annotations.tsv'
        }
        
        # Cache for loaded data
        self.neuron_data = None
        self.mechanosensory_circuit = None
        self.data_loaded = False
        self.cache_timestamp = None
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        logger.info("🌐 FlyWire Cloud Data Service initialized")
        logger.info("✅ No SSL issues - using pre-downloaded data from cloud!")
    
    def _should_refresh_cache(self) -> bool:
        """Check if we should refresh the cached data"""
        if not self.data_loaded or self.cache_timestamp is None:
            return True
        
        return datetime.now() - self.cache_timestamp > self.cache_duration
    
    def load_cloud_data(self, force_refresh=False):
        """Load FlyWire data from cloud storage"""
        if self.data_loaded and not force_refresh and not self._should_refresh_cache():
            logger.info("📊 Using cached FlyWire data")
            return
        
        try:
            logger.info("☁️ Loading FlyWire data from cloud...")
            
            # Load neuron annotations from GitHub (the official source)
            logger.info("📥 Downloading neuron annotations from GitHub...")
            response = requests.get(self.data_urls['neuron_annotations'], timeout=30)
            response.raise_for_status()
            
            # Parse TSV data
            tsv_data = io.StringIO(response.text)
            self.neuron_data = pd.read_csv(tsv_data, sep='\t', low_memory=False)
            
            logger.info(f"✅ Loaded {len(self.neuron_data):,} neurons from cloud")
            
            # Pre-process mechanosensory circuit
            self._create_mechanosensory_circuit()
            
            self.data_loaded = True
            self.cache_timestamp = datetime.now()
            
            logger.info("🎯 Cloud data loaded successfully - no API calls to cave.flywire.ai needed!")
            
        except Exception as e:
            logger.error(f"❌ Failed to load cloud data: {e}")
            # Fallback to minimal functionality
            if self.neuron_data is None:
                logger.warning("Using empty dataset for basic functionality")
                self.neuron_data = pd.DataFrame()
            raise
    
    def _create_mechanosensory_circuit(self):
        """Pre-process mechanosensory neurons into circuit format"""
        if self.neuron_data is None or len(self.neuron_data) == 0:
            return
        
        try:
            # Get mechanosensory neurons
            mech_mask = self.neuron_data['cell_class'] == 'mechanosensory'
            mech_neurons_df = self.neuron_data[mech_mask]
            
            # Convert to API format
            neurons = []
            for _, row in mech_neurons_df.head(100).iterrows():  # Limit for performance
                try:
                    neuron = {
                        'id': str(row['root_id']),
                        'type': str(row['cell_type']) if pd.notna(row['cell_type']) else 'mechanosensory',
                        'position': [
                            float(row['pos_x']) if pd.notna(row['pos_x']) else 0.0,
                            float(row['pos_y']) if pd.notna(row['pos_y']) else 0.0,
                            float(row['pos_z']) if pd.notna(row['pos_z']) else 0.0
                        ],
                        'soma_position': [
                            float(row['soma_x']) if pd.notna(row['soma_x']) else 0.0,
                            float(row['soma_y']) if pd.notna(row['soma_y']) else 0.0,
                            float(row['soma_z']) if pd.notna(row['soma_z']) else 0.0
                        ],
                        'activity': 0.0,
                        'mesh_id': row['root_id'],
                        'confidence': 1.0,
                        'source': 'flywire_cloud_data',
                        'super_class': str(row['super_class']) if pd.notna(row['super_class']) else 'unknown',
                        'cell_class': str(row['cell_class']) if pd.notna(row['cell_class']) else 'unknown',
                        'side': str(row['side']) if pd.notna(row['side']) else 'unknown'
                    }
                    neurons.append(neuron)
                except Exception as neuron_error:
                    logger.warning(f"Skipping neuron due to error: {neuron_error}")
                    continue
            
            self.mechanosensory_circuit = {
                'name': 'Mechanosensory Circuit',
                'neurons': neurons,
                'type': 'mechanosensory',
                'color': '#FF4081',
                'source': 'flywire_cloud_data',
                'total_available': len(mech_neurons_df),
                'loaded_count': len(neurons)
            }
            
            logger.info(f"✅ Pre-processed {len(neurons)} mechanosensory neurons from {len(mech_neurons_df)} total")
            
        except Exception as e:
            logger.error(f"Failed to create mechanosensory circuit: {e}")
            self.mechanosensory_circuit = None
    
    def get_circuits(self) -> List[Dict[str, Any]]:
        """Get available circuits from cloud data"""
        # Ensure data is loaded
        if not self.data_loaded:
            self.load_cloud_data()
        
        circuits = []
        
        # Add mechanosensory circuit
        if self.mechanosensory_circuit:
            circuits.append(self.mechanosensory_circuit)
        
        # Add auditory circuit
        if self.neuron_data is not None and len(self.neuron_data) > 0:
            auditory_neurons = self.get_auditory_neurons(limit=50)
            if auditory_neurons:
                circuits.append({
                    'name': 'Auditory Circuit (Johnston\'s Organ)',
                    'neurons': auditory_neurons,
                    'type': 'auditory',
                    'color': '#2196F3',
                    'source': 'flywire_cloud_data'
                })
        
        return circuits
    
    def get_mechanosensory_neurons(self, limit=50) -> List[Dict[str, Any]]:
        """Get mechanosensory neurons from cloud data"""
        if not self.data_loaded:
            self.load_cloud_data()
        
        if self.mechanosensory_circuit:
            return self.mechanosensory_circuit['neurons'][:limit]
        return []
    
    def get_auditory_neurons(self, limit=50) -> List[Dict[str, Any]]:
        """Get auditory neurons (JO types) from cloud data"""
        if not self.data_loaded:
            self.load_cloud_data()
        
        if self.neuron_data is None or len(self.neuron_data) == 0:
            return []
        
        try:
            # Get JO (Johnston's Organ) neurons
            jo_mask = self.neuron_data['cell_type'].str.contains('JO-', na=False)
            jo_neurons = self.neuron_data[jo_mask]
            
            neurons = []
            for _, row in jo_neurons.head(limit).iterrows():
                try:
                    neuron = {
                        'id': str(row['root_id']),
                        'type': str(row['cell_type']) if pd.notna(row['cell_type']) else 'auditory',
                        'position': [
                            float(row['pos_x']) if pd.notna(row['pos_x']) else 0.0,
                            float(row['pos_y']) if pd.notna(row['pos_y']) else 0.0,
                            float(row['pos_z']) if pd.notna(row['pos_z']) else 0.0
                        ],
                        'soma_position': [
                            float(row['soma_x']) if pd.notna(row['soma_x']) else 0.0,
                            float(row['soma_y']) if pd.notna(row['soma_y']) else 0.0,
                            float(row['soma_z']) if pd.notna(row['soma_z']) else 0.0
                        ],
                        'activity': 0.0,
                        'mesh_id': row['root_id'],
                        'confidence': 1.0,
                        'source': 'flywire_cloud_data',
                        'super_class': str(row['super_class']) if pd.notna(row['super_class']) else 'unknown',
                        'cell_class': str(row['cell_class']) if pd.notna(row['cell_class']) else 'unknown',
                        'side': str(row['side']) if pd.notna(row['side']) else 'unknown'
                    }
                    neurons.append(neuron)
                except Exception as neuron_error:
                    logger.warning(f"Skipping auditory neuron due to error: {neuron_error}")
                    continue
            
            logger.info(f"Found {len(neurons)} auditory neurons")
            return neurons
            
        except Exception as e:
            logger.error(f"Failed to get auditory neurons: {e}")
            return []
    
    def search_neurons_by_type(self, cell_type: str, limit=20) -> List[Dict[str, Any]]:
        """Search neurons by cell type from cloud data"""
        if not self.data_loaded:
            self.load_cloud_data()
        
        if self.neuron_data is None or len(self.neuron_data) == 0:
            return []
        
        try:
            mask = self.neuron_data['cell_type'].str.contains(cell_type, case=False, na=False)
            matching_neurons = self.neuron_data[mask]
            
            neurons = []
            for _, row in matching_neurons.head(limit).iterrows():
                try:
                    neuron = {
                        'id': str(row['root_id']),
                        'type': str(row['cell_type']) if pd.notna(row['cell_type']) else cell_type,
                        'position': [
                            float(row['pos_x']) if pd.notna(row['pos_x']) else 0.0,
                            float(row['pos_y']) if pd.notna(row['pos_y']) else 0.0,
                            float(row['pos_z']) if pd.notna(row['pos_z']) else 0.0
                        ],
                        'soma_position': [
                            float(row['soma_x']) if pd.notna(row['soma_x']) else 0.0,
                            float(row['soma_y']) if pd.notna(row['soma_y']) else 0.0,
                            float(row['soma_z']) if pd.notna(row['soma_z']) else 0.0
                        ],
                        'activity': 0.0,
                        'mesh_id': row['root_id'],
                        'confidence': 1.0,
                        'source': 'flywire_cloud_data',
                        'super_class': str(row['super_class']) if pd.notna(row['super_class']) else 'unknown',
                        'cell_class': str(row['cell_class']) if pd.notna(row['cell_class']) else 'unknown'
                    }
                    neurons.append(neuron)
                except Exception as neuron_error:
                    logger.warning(f"Skipping neuron due to error: {neuron_error}")
                    continue
            
            return neurons
            
        except Exception as e:
            logger.error(f"Failed to search neurons: {e}")
            return []

# Initialize service
flywire_service = FlyWireCloudDataService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Lazy load data on health check
        if not flywire_service.data_loaded:
            flywire_service.load_cloud_data()
        
        neuron_count = len(flywire_service.neuron_data) if flywire_service.neuron_data is not None else 0
        
        return jsonify({
            'status': 'healthy',
            'service': 'flywire_cloud_backend',
            'data_source': 'cloud_storage',
            'ssl_issues': 'resolved_via_cloud_data',
            'neurons_available': neuron_count,
            'cache_status': 'loaded' if flywire_service.data_loaded else 'not_loaded',
            'cache_age_minutes': int((datetime.now() - flywire_service.cache_timestamp).total_seconds() / 60) if flywire_service.cache_timestamp else 0
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'service': 'flywire_cloud_backend',
            'error': str(e),
            'ssl_issues': 'resolved_via_cloud_data'
        }), 500

@app.route('/api/circuits/search', methods=['GET'])
def search_circuits():
    """Search for neural circuits - using cloud data"""
    try:
        circuits = flywire_service.get_circuits()
        
        return jsonify({
            'success': True,
            'circuits': circuits,
            'total_circuits': len(circuits),
            'data_source': 'flywire_cloud_data',
            'message': 'Circuits loaded from cloud FlyWire data - no SSL API calls needed!'
        })
        
    except Exception as e:
        logger.error(f"Circuit search failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data_source': 'flywire_cloud_data',
            'circuits': []
        }), 500

@app.route('/api/neurons/mechanosensory', methods=['GET'])
def get_mechanosensory():
    """Get mechanosensory neurons from cloud data"""
    try:
        limit = request.args.get('limit', 50, type=int)
        neurons = flywire_service.get_mechanosensory_neurons(limit=limit)
        
        return jsonify({
            'success': True,
            'neurons': neurons,
            'total_found': len(neurons),
            'data_source': 'flywire_cloud_data'
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
    """Search neurons by type from cloud data"""
    try:
        cell_type = request.args.get('type', 'mechanosensory')
        limit = request.args.get('limit', 20, type=int)
        
        neurons = flywire_service.search_neurons_by_type(cell_type, limit=limit)
        
        return jsonify({
            'success': True,
            'neurons': neurons,
            'search_type': cell_type,
            'total_found': len(neurons),
            'data_source': 'flywire_cloud_data'
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
    """Get dataset statistics from cloud data"""
    try:
        stats = {}
        
        if not flywire_service.data_loaded:
            flywire_service.load_cloud_data()
        
        if flywire_service.neuron_data is not None and len(flywire_service.neuron_data) > 0:
            df = flywire_service.neuron_data
            stats = {
                'total_neurons': len(df),
                'mechanosensory_neurons': len(df[df['cell_class'] == 'mechanosensory']),
                'auditory_neurons': len(df[df['cell_type'].str.contains('JO-', na=False)]),
                'sensory_neurons': len(df[df['super_class'] == 'sensory']),
                'top_cell_types': df['cell_type'].value_counts().head(10).to_dict(),
                'data_source': 'cloud_flywire_data',
                'ssl_status': 'not_needed_cloud_data',
                'cache_status': 'loaded',
                'cache_age_minutes': int((datetime.now() - flywire_service.cache_timestamp).total_seconds() / 60) if flywire_service.cache_timestamp else 0
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

@app.route('/api/refresh', methods=['POST'])
def refresh_data():
    """Force refresh of cloud data"""
    try:
        flywire_service.load_cloud_data(force_refresh=True)
        
        return jsonify({
            'success': True,
            'message': 'Cloud data refreshed successfully',
            'neurons_loaded': len(flywire_service.neuron_data) if flywire_service.neuron_data is not None else 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Data refresh failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0' if os.environ.get('PORT') else 'localhost'
    
    logger.info(f"🚀 Starting FlyWire Cloud Data Backend on {host}:{port}")
    logger.info("☁️ Loading FlyWire data from cloud storage")
    logger.info("✅ No SSL issues - using pre-downloaded cloud data!")
    
    app.run(host=host, port=port, debug=True) 