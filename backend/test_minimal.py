#!/usr/bin/env python3
"""
Minimal test to verify Neuroglancer and Flask work
"""

from flask import Flask, jsonify
from flask_cors import CORS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask backend running'
    })

@app.route('/api/test', methods=['GET'])
def test_neuroglancer():
    """Test Neuroglancer import"""
    try:
        import neuroglancer
        return jsonify({
            'success': True,
            'neuroglancer_version': neuroglancer.__version__ if hasattr(neuroglancer, '__version__') else 'unknown'
        })
    except ImportError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    logger.info("🚀 Starting minimal test backend...")
    logger.info("🔌 API: http://localhost:5000/api/health")
    
    app.run(
        host='localhost',
        port=5000,
        debug=True,
        threaded=True
    ) 