#!/usr/bin/env python3
"""
Minimal Flask app for testing Cloud Run deployment
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    'https://neurovis-3d.web.app',
    'https://neurovis-3d.firebaseapp.com', 
    'http://localhost:4200'
])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Basic health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'Minimal backend is running',
        'environment': 'cloud_run' if os.getenv('K_SERVICE') else 'local',
        'port': os.getenv('PORT', '8080')
    })

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        'success': True,
        'message': 'Test successful',
        'data_source': 'minimal'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', '8080'))
    
    logger.info("Starting minimal test backend...")
    logger.info(f"API: http://0.0.0.0:{port}/api/health")
    logger.info(f"Environment: {'Cloud Run' if os.getenv('K_SERVICE') else 'Local'}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    ) 