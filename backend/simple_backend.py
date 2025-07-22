#!/usr/bin/env python3
"""
Simplified FlyWire CHRIMSON Backend
Cloud Run Compatible with deferred initialization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import json

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

# Global state
flywire_service = None
initialization_attempted = False

def initialize_flywire_service():
    """Initialize FlyWire service with deferred imports"""
    global flywire_service, initialization_attempted
    
    if initialization_attempted:
        return flywire_service
    
    initialization_attempted = True
    
    try:
        logger.info("Attempting to initialize FlyWire service...")
        
        # Import complex dependencies only when needed
        import neuroglancer
        import numpy as np
        from dotenv import load_dotenv
        from caveclient import CAVEclient
        
        load_dotenv()
        
        # Create simplified service class
        class FlyWireService:
            def __init__(self):
                self.cave_token = os.getenv('FLYWIRE_CAVE_TOKEN', 'b927b9cd93ba0a9b569ab9e32d231dbc')
                self.dataset = 'flywire_fafb_production'
                self.neuroglancer_port = int(os.getenv('NEUROGLANCER_PORT', '9997'))
                self.cave_client = None
                self.viewer = None
                self.current_circuits = []
                
                logger.info("FlyWire service initialized successfully")
        
        flywire_service = FlyWireService()
        return flywire_service
        
    except Exception as e:
        logger.error(f"Failed to initialize FlyWire service: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    service = initialize_flywire_service()
    
    return jsonify({
        'status': 'healthy',
        'flywire_service': 'initialized' if service else 'failed',
        'environment': 'cloud_run' if os.getenv('K_SERVICE') else 'local',
        'port': os.getenv('PORT', '8080')
    })

@app.route('/api/circuits/search', methods=['GET'])
def search_circuits():
    """Search for CHRIMSON circuits from FlyWire"""
    service = initialize_flywire_service()
    
    if service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not available',
            'data_source': 'flywire'
        }), 500
    
    # Return mock data for now since full implementation is complex
    mock_circuits = [
        {
            'name': 'Mechanosensory Circuit',
            'neurons': [
                {
                    'id': 'mock_001',
                    'type': 'mechanosensory',
                    'position': [25000, 15000, 10000],
                    'activity': 0.0
                }
            ],
            'type': 'mechanosensory',
            'color': '#FF4081',
            'source': 'flywire_mock'
        }
    ]
    
    return jsonify({
        'success': True,
        'circuits': mock_circuits,
        'count': len(mock_circuits),
        'total_neurons': sum(len(c['neurons']) for c in mock_circuits),
        'data_source': 'flywire_mock'
    })

@app.route('/api/visualization/create', methods=['POST'])
def create_visualization():
    """Create Neuroglancer visualization"""
    service = initialize_flywire_service()
    
    if service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not available',
            'data_source': 'flywire'
        }), 500
    
    return jsonify({
        'success': True,
        'neuroglancer_url': f'http://localhost:{service.neuroglancer_port}',
        'features': ['mock_data'],
        'data_source': 'flywire_mock'
    })

@app.route('/api/activity/update', methods=['POST'])
def update_activity():
    """Update circuit activity from FEM data"""
    service = initialize_flywire_service()
    
    if service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not available',
            'data_source': 'flywire'
        }), 500
    
    return jsonify({
        'success': True,
        'data_source': 'flywire_mock'
    })

@app.route('/api/circuits/current', methods=['GET'])
def get_circuits():
    """Get current circuit data"""
    service = initialize_flywire_service()
    
    if service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not available',
            'data_source': 'flywire'
        }), 500
    
    return jsonify({
        'success': True,
        'circuits': service.current_circuits,
        'data_source': 'flywire'
    })

@app.route('/api/test-ssl', methods=['GET'])
def test_ssl():
    """Test SSL connection to FlyWire"""
    try:
        import requests
        response = requests.get('https://cave.flywire.ai', timeout=10)
        return jsonify({
            'success': True,
            'status_code': response.status_code,
            'ssl_working': True,
            'message': 'SSL connection successful'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'ssl_working': False,
            'error': str(e),
            'message': 'SSL connection failed'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', '8080'))
    
    logger.info("Starting simplified FlyWire backend...")
    logger.info(f"API: http://0.0.0.0:{port}/api/health")
    logger.info(f"Environment: {'Cloud Run' if os.getenv('K_SERVICE') else 'Local'}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    ) 